package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.dto.ProjectPageDTO;
import com.beike.platform.dto.ProjectSaveDTO;
import com.beike.platform.service.ProjectService;
import com.beike.platform.vo.ProjectVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('project:list')")
    public Result<IPage<ProjectVO>> page(ProjectPageDTO dto) {
        return Result.success(projectService.page(dto));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('project:list')")
    public Result<ProjectVO> detail(@PathVariable Long id) {
        return Result.success(projectService.detail(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('project:create')")
    public Result<Void> create(@Valid @RequestBody ProjectSaveDTO dto) {
        projectService.create(dto);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('project:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody ProjectSaveDTO dto) {
        projectService.update(id, dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('project:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    @PreAuthorize("hasAuthority('project:delete')")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        projectService.batchDelete(ids);
        return Result.success();
    }
}
