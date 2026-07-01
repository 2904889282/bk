package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.dto.CluePageDTO;
import com.beike.platform.dto.ClueSaveDTO;
import com.beike.platform.entity.Clue;
import com.beike.platform.entity.Project;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.mapper.ProjectMapper;
import com.beike.platform.service.ClueService;
import com.beike.platform.vo.ClueVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClueServiceImpl implements ClueService {

    private final ClueMapper clueMapper;
    private final ProjectMapper projectMapper;

    @Override
    public IPage<ClueVO> page(CluePageDTO dto) {
        Page<Clue> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        IPage<Clue> result = clueMapper.selectPageWithFilter(page, dto);
        return result.convert(this::toVO);
    }

    @Override
    public ClueVO detail(Long id) {
        Clue clue = clueMapper.selectById(id);
        if (clue == null) throw BizException.notFound("线索");
        return toVO(clue);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(ClueSaveDTO dto) {
        Clue clue = new Clue();
        BeanUtils.copyProperties(dto, clue);
        clue.setCreateDate(LocalDate.now());
        clue.setIsConverted(0);
        clueMapper.insert(clue);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(ClueSaveDTO dto, Long id) {
        // 校验：已转项目的线索不可编辑
        Clue existing = clueMapper.selectById(id);
        if (existing == null) throw BizException.notFound("线索");
        if (existing.getIsConverted() != null && existing.getIsConverted() == 1) {
            throw new BizException("已转项目的线索不可编辑");
        }

        Clue clue = new Clue();
        BeanUtils.copyProperties(dto, clue);
        clue.setId(id);
        clueMapper.updateById(clue);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Clue clue = clueMapper.selectById(id);
        if (clue == null) throw BizException.notFound("线索");
        clueMapper.deleteById(id);  // MyBatis-Plus 逻辑删除
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择要删除的线索");
        clueMapper.deleteBatchIds(ids);  // MyBatis-Plus 批量逻辑删除
    }

    // ========== 内部方法 ==========

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long convertToProject(Long clueId, String projectName, String projectManager, BigDecimal projectAmount) {
        // 1. 校验线索存在且状态为已承接，未转项目
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");
        if (!"已承接".equals(clue.getClueStatus())) {
            throw new BizException("仅已承接状态的线索可以转为项目，当前状态：" + clue.getClueStatus());
        }
        if (clue.getIsConverted() != null && clue.getIsConverted() == 1) {
            throw new BizException("该线索已转为项目，不可重复操作");
        }

        // 2. 字段映射：创建项目（严格按数据模型文档）
        Project project = new Project();
        project.setProjectName(projectName != null ? projectName : clue.getClueName());
        project.setClientName(clue.getClientCompany());
        project.setProjectManager(projectManager != null ? projectManager : clue.getBeikeOwner());
        project.setProjectAmount(projectAmount);
        project.setProjectStatus("进行中");
        project.setProgress(0);
        project.setStartDate(LocalDate.now());
        project.setProjectLevel(clue.getClueLevel());
        project.setDeptBelong(clue.getDeptBelong());
        project.setSourceClueId(clueId);
        project.setArUserId(clue.getArUserId());
        project.setSrUserId(clue.getSrUserId());
        project.setFrUserId(clue.getFrUserId());
        project.setDescription(clue.getRequirementDesc());
        project.setRiskCount(0);
        projectMapper.insert(project);

        // 3. 更新线索：标记已转 + 回填项目ID
        Clue update = new Clue();
        update.setId(clueId);
        update.setClueStatus("已转项目");
        update.setIsConverted(1);
        update.setRelatedProjectId(project.getId());
        clueMapper.updateById(update);

        return project.getId();
    }

    private ClueVO toVO(Clue clue) {
        ClueVO vo = new ClueVO();
        BeanUtils.copyProperties(clue, vo);
        vo.setIsConverted(clue.getIsConverted() != null && clue.getIsConverted() == 1);
        return vo;
    }
}
