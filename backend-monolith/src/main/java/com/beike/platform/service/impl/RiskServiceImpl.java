package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.dto.RiskPageDTO;
import com.beike.platform.dto.RiskSaveDTO;
import com.beike.platform.entity.Project;
import com.beike.platform.entity.Risk;
import com.beike.platform.mapper.ProjectMapper;
import com.beike.platform.mapper.RiskMapper;
import com.beike.platform.service.RiskService;
import com.beike.platform.vo.RiskVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

    private final RiskMapper riskMapper;
    private final ProjectMapper projectMapper;

    @Override
    public IPage<RiskVO> page(RiskPageDTO dto) {
        Page<Risk> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        IPage<Risk> result = riskMapper.selectPageWithFilter(page, dto);

        // 批量获取项目名称映射
        List<Long> projectIds = result.getRecords().stream()
                .map(Risk::getProjectId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> projectNameMap = projectIds.isEmpty() ? Map.of() :
                projectMapper.selectBatchIds(projectIds).stream()
                        .collect(Collectors.toMap(Project::getId, Project::getProjectName, (a, b) -> a));

        return result.convert(risk -> toVO(risk, projectNameMap));
    }

    @Override
    public RiskVO detail(Long id) {
        Risk risk = riskMapper.selectById(id);
        if (risk == null) throw BizException.notFound("风险");
        Map<Long, String> nameMap = Map.of();
        if (risk.getProjectId() != null) {
            Project project = projectMapper.selectById(risk.getProjectId());
            if (project != null) nameMap = Map.of(project.getId(), project.getProjectName());
        }
        return toVO(risk, nameMap);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(RiskSaveDTO dto) {
        Risk risk = new Risk();
        BeanUtils.copyProperties(dto, risk);
        risk.setStatus("open");
        riskMapper.insert(risk);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(RiskSaveDTO dto, Long id) {
        Risk existing = riskMapper.selectById(id);
        if (existing == null) throw BizException.notFound("风险");

        Risk risk = new Risk();
        BeanUtils.copyProperties(dto, risk);
        risk.setId(id);
        riskMapper.updateById(risk);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Risk risk = riskMapper.selectById(id);
        if (risk == null) throw BizException.notFound("风险");
        riskMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择要删除的风险");
        riskMapper.deleteBatchIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resolve(Long id) {
        Risk risk = riskMapper.selectById(id);
        if (risk == null) throw BizException.notFound("风险");
        if (!"open".equals(risk.getStatus())) throw new BizException("该风险已解决");

        Risk update = new Risk();
        update.setId(id);
        update.setStatus("resolved");
        riskMapper.updateById(update);
    }

    private RiskVO toVO(Risk risk, Map<Long, String> projectNameMap) {
        RiskVO vo = new RiskVO();
        BeanUtils.copyProperties(risk, vo);
        if (risk.getProjectId() != null) {
            vo.setProjectName(projectNameMap.getOrDefault(risk.getProjectId(), null));
        }
        return vo;
    }
}
