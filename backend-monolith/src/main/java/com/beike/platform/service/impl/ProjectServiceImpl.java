package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.dto.ProjectPageDTO;
import com.beike.platform.dto.ProjectSaveDTO;
import com.beike.platform.entity.Project;
import com.beike.platform.mapper.ProjectMapper;
import com.beike.platform.service.ProjectService;
import com.beike.platform.vo.ProjectVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectMapper projectMapper;

    @Override
    public IPage<ProjectVO> page(ProjectPageDTO dto) {
        Page<Project> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        return projectMapper.selectPageWithFilter(page, dto).convert(this::toVO);
    }

    @Override
    public ProjectVO detail(Long id) {
        Project p = projectMapper.selectById(id);
        if (p == null) throw BizException.notFound("项目");
        return toVO(p);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(ProjectSaveDTO dto) {
        Project project = new Project();
        BeanUtils.copyProperties(dto, project);
        project.setRiskCount(0);
        projectMapper.insert(project);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, ProjectSaveDTO dto) {
        Project existing = projectMapper.selectById(id);
        if (existing == null) throw BizException.notFound("项目");
        Project project = new Project();
        BeanUtils.copyProperties(dto, project);
        project.setId(id);
        projectMapper.updateById(project);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (projectMapper.selectById(id) == null) throw BizException.notFound("项目");
        projectMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择要删除的项目");
        projectMapper.deleteBatchIds(ids);
    }

    private ProjectVO toVO(Project p) {
        ProjectVO vo = new ProjectVO();
        BeanUtils.copyProperties(p, vo);
        return vo;
    }
}
