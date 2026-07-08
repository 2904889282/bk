package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.Result;
import com.beike.platform.common.BizException;
import com.beike.platform.entity.Clue;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.mapper.ProjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recycle")
@RequiredArgsConstructor
public class RecycleController {

    private static final String TYPE_PROJECT = "project";
    private static final String STATUS_CONVERTED = "已转项目";

    private final ClueMapper clueMapper;
    private final ProjectMapper projectMapper;

    @Data
    public static class RecyclePageDTO {
        private Integer pageNum = 1;
        private Integer pageSize = 10;
        private String type;
    }

    @Data
    public static class RestoreDTO {
        @NotNull private String type;
        @NotEmpty private List<Long> ids;
    }

    // ================================================================
    // 分页列表
    // ================================================================
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('recycle:list')")
    public Result<IPage<?>> page(RecyclePageDTO dto) {
        Page<?> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        if (TYPE_PROJECT.equals(dto.getType())) {
            return Result.success(projectMapper.selectDeletedPage((Page) page));
        }
        return Result.success(clueMapper.selectDeletedPage((Page) page));
    }

    // ================================================================
    // 恢复
    // ================================================================
    @PutMapping("/restore")
    @PreAuthorize("hasAuthority('recycle:list')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> restore(@Valid @RequestBody RestoreDTO dto) {
        if (dto.getIds() == null || dto.getIds().isEmpty()) {
            throw new BizException("请选择要恢复的数据");
        }
        if (TYPE_PROJECT.equals(dto.getType())) {
            for (Long id : dto.getIds()) { projectMapper.restoreById(id); }
        } else {
            for (Long id : dto.getIds()) { clueMapper.restoreById(id); }
        }
        return Result.success();
    }

    // ================================================================
    // 永久删除
    // ================================================================
    @DeleteMapping("/perm")
    @PreAuthorize("hasAuthority('recycle:list')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> permDelete(@Valid @RequestBody RestoreDTO dto) {
        if (dto.getIds() == null || dto.getIds().isEmpty()) {
            throw new BizException("请选择要删除的数据");
        }
        if (TYPE_PROJECT.equals(dto.getType())) {
            for (Long id : dto.getIds()) { projectMapper.permDeleteById(id); }
        } else {
            // 批量查出所有已删除线索，避免循环中逐条查询
            List<Clue> clues = clueMapper.selectBatchIdsIgnoreDeleted(dto.getIds());
            for (Long id : dto.getIds()) {
                Clue clue = clues.stream()
                        .filter(c -> c.getId().equals(id))
                        .findFirst().orElse(null);
                if (clue != null && STATUS_CONVERTED.equals(clue.getClueStatus())) {
                    throw new BizException("已转项目的线索不可永久删除，请先删除关联项目");
                }
                clueMapper.permDeleteById(id);
            }
        }
        return Result.success();
    }
}
