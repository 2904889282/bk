package com.beike.platform.controller;

import com.beike.platform.common.Result;
import com.beike.platform.dto.FollowSaveDTO;
import com.beike.platform.service.ClueFollowService;
import com.beike.platform.vo.FollowVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clue")
@RequiredArgsConstructor
public class ClueFollowController {

    private final ClueFollowService followService;

    /**
     * 查询线索的跟进记录列表（按日期倒序）
     * GET /api/clue/{clueId}/follow
     */
    @GetMapping("/{clueId}/follow")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<List<FollowVO>> list(@PathVariable Long clueId) {
        return Result.success(followService.listByClueId(clueId));
    }

    /**
     * 新增跟进记录（含可选状态变更）
     * POST /api/clue/follow
     */
    @PostMapping("/follow")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> create(@Valid @RequestBody FollowSaveDTO dto) {
        followService.create(dto);
        return Result.success();
    }

    /**
     * 编辑跟进记录（仅创建人或管理员）
     * PUT /api/clue/follow/{id}
     */
    @PutMapping("/follow/{id}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody FollowSaveDTO dto) {
        followService.update(id, dto);
        return Result.success();
    }

    /**
     * 逻辑删除跟进记录
     * DELETE /api/clue/follow/{id}
     */
    @DeleteMapping("/follow/{id}")
    @PreAuthorize("hasAuthority('clue:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        followService.delete(id);
        return Result.success();
    }
}
