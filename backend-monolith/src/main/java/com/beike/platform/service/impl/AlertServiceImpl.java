package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.dto.AlertPageDTO;
import com.beike.platform.dto.AlertSaveDTO;
import com.beike.platform.entity.Alert;
import com.beike.platform.entity.Project;
import com.beike.platform.mapper.AlertMapper;
import com.beike.platform.mapper.ProjectMapper;
import com.beike.platform.service.AlertService;
import com.beike.platform.vo.AlertVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertMapper alertMapper;
    private final ProjectMapper projectMapper;

    @Override
    public IPage<AlertVO> page(AlertPageDTO dto) {
        Page<Alert> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        IPage<Alert> result = alertMapper.selectPageWithFilter(page, dto);

        List<Long> projectIds = result.getRecords().stream()
                .map(Alert::getProjectId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> projectNameMap = projectIds.isEmpty() ? Map.of() :
                projectMapper.selectBatchIds(projectIds).stream()
                        .collect(Collectors.toMap(Project::getId, Project::getProjectName, (a, b) -> a));

        return result.convert(alert -> toVO(alert, projectNameMap));
    }

    @Override
    public AlertVO detail(Long id) {
        Alert alert = alertMapper.selectById(id);
        if (alert == null) throw BizException.notFound("预警");
        Map<Long, String> nameMap = Map.of();
        if (alert.getProjectId() != null) {
            Project project = projectMapper.selectById(alert.getProjectId());
            if (project != null) nameMap = Map.of(project.getId(), project.getProjectName());
        }
        return toVO(alert, nameMap);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(AlertSaveDTO dto) {
        Alert alert = new Alert();
        BeanUtils.copyProperties(dto, alert);
        alert.setStatus("open");
        alertMapper.insert(alert);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(AlertSaveDTO dto, Long id) {
        Alert existing = alertMapper.selectById(id);
        if (existing == null) throw BizException.notFound("预警");

        Alert alert = new Alert();
        BeanUtils.copyProperties(dto, alert);
        alert.setId(id);
        alertMapper.updateById(alert);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Alert alert = alertMapper.selectById(id);
        if (alert == null) throw BizException.notFound("预警");
        alertMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择要删除的预警");
        alertMapper.deleteBatchIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resolve(Long id) {
        Alert alert = alertMapper.selectById(id);
        if (alert == null) throw BizException.notFound("预警");
        if (!"open".equals(alert.getStatus())) throw new BizException("该预警已处理");

        Alert update = new Alert();
        update.setId(id);
        update.setStatus("resolved");
        alertMapper.updateById(update);
    }

    private AlertVO toVO(Alert alert, Map<Long, String> projectNameMap) {
        AlertVO vo = new AlertVO();
        BeanUtils.copyProperties(alert, vo);
        if (alert.getProjectId() != null) {
            vo.setProjectName(projectNameMap.getOrDefault(alert.getProjectId(), null));
        }
        return vo;
    }
}
