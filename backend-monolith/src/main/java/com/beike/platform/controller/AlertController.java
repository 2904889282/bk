package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.dto.AlertPageDTO;
import com.beike.platform.dto.AlertSaveDTO;
import com.beike.platform.service.AlertService;
import com.beike.platform.vo.AlertVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alert")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    /** 分页列表 */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('alert:list')")
    public Result<IPage<AlertVO>> page(AlertPageDTO dto) {
        return Result.success(alertService.page(dto));
    }

    /** 详情 */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('alert:list')")
    public Result<AlertVO> detail(@PathVariable Long id) {
        return Result.success(alertService.detail(id));
    }

    /** 新增 */
    @PostMapping
    @PreAuthorize("hasAuthority('alert:create')")
    public Result<Void> create(@Valid @RequestBody AlertSaveDTO dto) {
        alertService.create(dto);
        return Result.success();
    }

    /** 编辑 */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('alert:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody AlertSaveDTO dto) {
        alertService.update(dto, id);
        return Result.success();
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('alert:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        alertService.delete(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    @PreAuthorize("hasAuthority('alert:delete')")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        alertService.batchDelete(ids);
        return Result.success();
    }

    /** 标记已处理 */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('alert:edit')")
    public Result<Void> resolve(@PathVariable Long id) {
        alertService.resolve(id);
        return Result.success();
    }
}
