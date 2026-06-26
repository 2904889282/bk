#!/bin/bash
# ============================================================
# 快速回滚脚本
# 用法: ./rollback.sh [staging|production]
# ============================================================
set -euo pipefail
ENV=${1:-staging}
NAMESPACE=beike-admin

case $ENV in
  staging)  CTX="staging-cluster" ;;
  production) CTX="prod-cluster" ;;
  *) echo "未知环境: $ENV"; exit 1 ;;
esac
kubectl config use-context "$CTX"

echo "→ 回滚 beike-web ($ENV)..."
kubectl argo rollouts undo beike-web -n "$NAMESPACE" 2>/dev/null || {
  # 非 Argo 回退: 蓝绿回滚
  ACTIVE=$(kubectl get svc beike-web -n "$NAMESPACE" -o jsonpath='{.spec.selector.version}')
  PREV=$([ "$ACTIVE" = "blue" ] && echo "green" || echo "blue")
  kubectl patch svc beike-web -n "$NAMESPACE" \
    -p "{\"spec\":{\"selector\":{\"app\":\"beike-web\",\"version\":\"$PREV\"}}}"
  echo "回滚完成: $ACTIVE → $PREV"
}
echo "✓ 回滚成功"
