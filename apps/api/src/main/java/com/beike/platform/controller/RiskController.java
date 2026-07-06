package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.dto.RiskPageDTO;
import com.beike.platform.dto.RiskSaveDTO;
import com.beike.platform.service.RiskService;
import com.beike.platform.vo.RiskVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;

    /** 分页列表 */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('risk:list')")
    public Result<IPage<RiskVO>> page(RiskPageDTO dto) {
        return Result.success(riskService.page(dto));
    }

    /** 详情 */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('risk:list')")
    public Result<RiskVO> detail(@PathVariable Long id) {
        return Result.success(riskService.detail(id));
    }

    /** 新增 */
    @PostMapping
    @PreAuthorize("hasAuthority('risk:create')")
    public Result<Void> create(@Valid @RequestBody RiskSaveDTO dto) {
        riskService.create(dto);
        return Result.success();
    }

    /** 编辑 */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('risk:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody RiskSaveDTO dto) {
        riskService.update(dto, id);
        return Result.success();
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('risk:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        riskService.delete(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    @PreAuthorize("hasAuthority('risk:delete')")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        riskService.batchDelete(ids);
        return Result.success();
    }

    /** 标记已解决 */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('risk:edit')")
    public Result<Void> resolve(@PathVariable Long id) {
        riskService.resolve(id);
        return Result.success();
    }
}
