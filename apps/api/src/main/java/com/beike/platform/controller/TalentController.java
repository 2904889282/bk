package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.dto.TalentPageDTO;
import com.beike.platform.dto.TalentSaveDTO;
import com.beike.platform.service.TalentService;
import com.beike.platform.vo.TalentVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/talent")
@RequiredArgsConstructor
public class TalentController {

    private final TalentService talentService;

    /** 分页列表 */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('talent:list')")
    public Result<IPage<TalentVO>> page(TalentPageDTO dto) {
        return Result.success(talentService.page(dto));
    }

    /** 详情 */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('talent:list')")
    public Result<TalentVO> detail(@PathVariable Long id) {
        return Result.success(talentService.detail(id));
    }

    /** 新增 */
    @PostMapping
    @PreAuthorize("hasAuthority('talent:create')")
    public Result<Void> create(@Valid @RequestBody TalentSaveDTO dto) {
        talentService.create(dto);
        return Result.success();
    }

    /** 编辑 */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('talent:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody TalentSaveDTO dto) {
        talentService.update(dto, id);
        return Result.success();
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('talent:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        talentService.delete(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    @PreAuthorize("hasAuthority('talent:delete')")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        talentService.batchDelete(ids);
        return Result.success();
    }
}
