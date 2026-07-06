#!/bin/bash
# ============================================================
# 快速部署脚本 — 贝壳管理平台
# 用法: ./deploy.sh [staging|production] [blue-green|canary|rolling]
# ============================================================
set -euo pipefail

ENV=${1:-staging}
STRATEGY=${2:-blue-green}
REGISTRY="${DOCKER_REGISTRY:-harbor.beike.com}"
IMAGE="${REGISTRY}/beike-admin"
TAG="$(git rev-parse --short HEAD)-$(date +%Y%m%d%H%M)"
NAMESPACE="beike-admin"

GREEN='\033[0;32m'  YELLOW='\033[1;33m'  RED='\033[0;31m'  NC='\033[0m'

echo -e "${GREEN}=== 贝壳管理平台 部署 ===${NC}"
echo "  环境: ${ENV}  策略: ${STRATEGY}  镜像: ${IMAGE}:${TAG}"

# ============================
# Step 1: Build
# ============================
echo -e "${YELLOW}[1/4] 构建镜像...${NC}"
docker build --build-arg VITE_APP_VERSION="${TAG}" -t "${IMAGE}:${TAG}" -f docker/Dockerfile .
docker push "${IMAGE}:${TAG}"

# ============================
# Step 2: 选择集群
# ============================
case $ENV in
  staging)  CTX="staging-cluster" ;;
  production) CTX="prod-cluster" ;;
  *) echo -e "${RED}未知环境: ${ENV}${NC}"; exit 1 ;;
esac
kubectl config use-context "${CTX}"

# ============================
# Step 3: 部署
# ============================
echo -e "${YELLOW}[2/4] 部署 (${STRATEGY})...${NC}"
case $STRATEGY in
  blue-green)
    ACTIVE=$(kubectl get svc beike-web -n "${NAMESPACE}" -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")
    NEW=$([ "$ACTIVE" = "blue" ] && echo "green" || echo "blue")
    echo "  蓝绿切换: ${ACTIVE} → ${NEW}"
    sed "s|IMAGE_PLACEHOLDER|${IMAGE}:${TAG}|g" ci-cd/k8s-deploy/blue-green/deployment.yml | \
      kubectl apply -n "${NAMESPACE}" -f -
    kubectl rollout status deployment/beike-web-${NEW} -n "${NAMESPACE}" --timeout=5m

    echo -e "${YELLOW}[3/4] 切换流量...${NC}"
    kubectl patch svc beike-web -n "${NAMESPACE}" \
      -p "{\"spec\":{\"selector\":{\"app\":\"beike-web\",\"version\":\"${NEW}\"}}}"
    echo -e "${GREEN}✓ 流量已切换到: ${NEW}${NC}"
    ;;

  canary)
    sed "s|IMAGE_PLACEHOLDER|${IMAGE}:${TAG}|g" ci-cd/k8s-deploy/canary/rollout.yml | \
      kubectl apply -n "${NAMESPACE}" -f -
    kubectl argo rollouts status beike-web -n "${NAMESPACE}" --timeout=20m
    ;;

  rolling|*)
    sed "s|beike-admin:latest|${IMAGE}:${TAG}|g" k8s/app/deployment.yml | \
      kubectl apply -n "${NAMESPACE}" -f -
    kubectl rollout status deployment/beike-web -n "${NAMESPACE}" --timeout=5m
    ;;
esac

# ============================
# Step 4: 验证
# ============================
echo -e "${YELLOW}[4/4] 健康检查...${NC}"
sleep 5
URL=$(kubectl get ingress beike-web -n "${NAMESPACE}" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost:8080")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${URL}/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ 部署成功! 健康检查通过 (HTTP ${HTTP_CODE})${NC}"
  echo "  访问: https://${URL}"
else
  echo -e "${RED}✗ 健康检查失败 (HTTP ${HTTP_CODE})${NC}"
  echo "  回滚: ./deploy.sh ${ENV} rollback"
  exit 1
fi
