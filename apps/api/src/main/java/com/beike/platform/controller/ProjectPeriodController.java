package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beike.platform.common.BizException;
import com.beike.platform.dto.ProjectPeriodSaveDTO;
import com.beike.platform.entity.ProjectPeriod;
import com.beike.platform.mapper.ProjectPeriodMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-period")
@RequiredArgsConstructor
public class ProjectPeriodController {

    private final ProjectPeriodMapper periodMapper;

    /** 获取项目的所有月度期数 */
    @GetMapping("/list/{projectId}")
    public List<ProjectPeriod> list(@PathVariable Long projectId) {
        return periodMapper.selectList(
            new LambdaQueryWrapper<ProjectPeriod>()
                .eq(ProjectPeriod::getProjectId, projectId)
                .orderByDesc(ProjectPeriod::getPeriodMonth)
        );
    }

    /** 获取单个月度详情 */
    @GetMapping("/{id}")
    public ProjectPeriod detail(@PathVariable Long id) {
        ProjectPeriod p = periodMapper.selectById(id);
        if (p == null) throw BizException.notFound("月度期数");
        return p;
    }

    /** 新增/更新月度期数（每月唯一，有则更新） */
    @PostMapping
    @Transactional(rollbackFor = Exception.class)
    public ProjectPeriod save(@RequestBody ProjectPeriodSaveDTO dto) {
        ProjectPeriod exist = periodMapper.selectOne(
            new LambdaQueryWrapper<ProjectPeriod>()
                .eq(ProjectPeriod::getProjectId, dto.getProjectId())
                .eq(ProjectPeriod::getPeriodMonth, dto.getPeriodMonth())
        );
        if (exist != null) {
            BeanUtils.copyProperties(dto, exist, "id", "createBy", "createTime");
            periodMapper.updateById(exist);
            return exist;
        }
        ProjectPeriod p = new ProjectPeriod();
        BeanUtils.copyProperties(dto, p);
        periodMapper.insert(p);
        return p;
    }

    /** 删除月度期数 */
    @DeleteMapping("/{id}")
    @Transactional(rollbackFor = Exception.class)
    public void delete(@PathVariable Long id) {
        periodMapper.deleteById(id);
    }
}
