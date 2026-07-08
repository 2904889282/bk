package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.constant.StageEnum;
import com.beike.platform.dto.PipelinePageDTO;
import com.beike.platform.dto.PipelineSaveDTO;
import com.beike.platform.service.PipelineService;
import com.beike.platform.vo.PipelineVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pipeline")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    /**
     * 商机分页列表（带数据权限过滤）
     * GET /api/pipeline/page?pageNum=1&pageSize=10&keyword=&stage=&owner=
     */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('pipeline:list')")
    public Result<IPage<PipelineVO>> page(PipelinePageDTO dto) {
        return Result.success(pipelineService.page(dto));
    }

    /**
     * 商机详情
     * GET /api/pipeline/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('pipeline:list')")
    public Result<PipelineVO> detail(@PathVariable Long id) {
        return Result.success(pipelineService.detail(id));
    }

    /**
     * 新建商机
     * POST /api/pipeline
     */
    @PostMapping
    @PreAuthorize("hasAuthority('pipeline:create')")
    public Result<Void> create(@Valid @RequestBody PipelineSaveDTO dto) {
        pipelineService.create(dto);
        return Result.success();
    }

    /**
     * 编辑商机
     * PUT /api/pipeline/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('pipeline:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody PipelineSaveDTO dto) {
        pipelineService.update(dto, id);
        return Result.success();
    }

    /**
     * 单条删除
     * DELETE /api/pipeline/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('pipeline:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        pipelineService.delete(id);
        return Result.success();
    }

    /**
     * 批量删除
     * DELETE /api/pipeline/batch
     */
    @DeleteMapping("/batch")
    @PreAuthorize("hasAuthority('pipeline:delete')")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        pipelineService.batchDelete(ids);
        return Result.success();
    }

    /**
     * 阶段字典（前后端统一口径）
     * GET /api/pipeline/stages
     */
    @GetMapping("/stages")
    public Result<List<Map<String, Object>>> stages() {
        List<Map<String, Object>> list = Arrays.stream(StageEnum.values())
                .map(s -> Map.<String, Object>of(
                        "code", s.getCode(),
                        "label", s.getLabel()
                ))
                .collect(Collectors.toList());
        return Result.success(list);
    }

    /**
     * 公海认领
     * POST /api/pipeline/{id}/claim
     */
    @PostMapping("/{id}/claim")
    @PreAuthorize("hasAuthority('pipeline:edit')")
    public Result<Void> claim(@PathVariable Long id) {
        pipelineService.claim(id);
        return Result.success();
    }

    /**
     * 移入公海
     * POST /api/pipeline/{id}/move-to-sea
     */
    @PostMapping("/{id}/move-to-sea")
    @PreAuthorize("hasAuthority('pipeline:edit')")
    public Result<Void> moveToSea(@PathVariable Long id) {
        pipelineService.moveToSea(id);
        return Result.success();
    }

}
