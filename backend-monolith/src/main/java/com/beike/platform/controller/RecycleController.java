package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.Result;
import com.beike.platform.common.BizException;
import com.beike.platform.entity.Clue;
import com.beike.platform.entity.Project;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.mapper.ProjectMapper;
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

    private final ClueMapper clueMapper;
    private final ProjectMapper projectMapper;

    @Data public static class RecyclePageDTO { private Integer pageNum=1; private Integer pageSize=10; private String type; }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:recycle')")
    public Result<IPage<?>> page(RecyclePageDTO dto) {
        if ("project".equals(dto.getType())) {
            return Result.success(projectMapper.selectDeletedPage(new Page<>(dto.getPageNum(), dto.getPageSize())));
        }
        return Result.success(clueMapper.selectDeletedPage(new Page<>(dto.getPageNum(), dto.getPageSize())));
    }

    @PutMapping("/restore")
    @PreAuthorize("hasAuthority('system:recycle')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> restore(@RequestBody RestoreDTO dto) {
        if ("project".equals(dto.getType())) {
            for (Long id : dto.getIds()) { projectMapper.restoreById(id); }
        } else {
            for (Long id : dto.getIds()) { clueMapper.restoreById(id); }
        }
        return Result.success();
    }

    @DeleteMapping("/perm")
    @PreAuthorize("hasAuthority('system:recycle')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> permDelete(@RequestBody RestoreDTO dto) {
        if ("project".equals(dto.getType())) {
            for (Long id : dto.getIds()) { projectMapper.permDeleteById(id); }
        } else {
            for (Long id : dto.getIds()) {
                Clue clue = clueMapper.selectByIdIgnoreDeleted(id);
                if (clue != null && "已转项目".equals(clue.getClueStatus())) throw new BizException("已转项目的线索不可永久删除，请先删除关联项目");
                clueMapper.permDeleteById(id);
            }
        }
        return Result.success();
    }

    @Data public static class RestoreDTO { private String type; private List<Long> ids; }
}
