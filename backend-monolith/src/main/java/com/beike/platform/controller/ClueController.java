package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.dto.CluePageDTO;
import com.beike.platform.dto.ClueSaveDTO;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.service.ClueService;
import com.beike.platform.vo.ClueVO;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clue")
@RequiredArgsConstructor
public class ClueController {

    private final ClueService clueService;
    private final ClueMapper clueMapper;

    /**
     * 线索分页列表
     * GET /api/clue/page?pageNum=1&pageSize=10&keyword=&status=&level=&owner=&dateFrom=&dateTo=
     */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<IPage<ClueVO>> page(CluePageDTO dto) {
        return Result.success(clueService.page(dto));
    }

    /**
     * 线索详情
     * GET /api/clue/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<ClueVO> detail(@PathVariable Long id) {
        return Result.success(clueService.detail(id));
    }

    /**
     * 新增线索
     * POST /api/clue
     */
    @PostMapping
    @PreAuthorize("hasAuthority('clue:create')")
    public Result<Void> create(@Valid @RequestBody ClueSaveDTO dto) {
        clueService.create(dto);
        return Result.success();
    }

    /**
     * 编辑线索
     * PUT /api/clue/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody ClueSaveDTO dto) {
        clueService.update(dto, id);
        return Result.success();
    }

    /**
     * 单条逻辑删除
     * DELETE /api/clue/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('clue:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        clueService.delete(id);
        return Result.success();
    }

    /**
     * 批量逻辑删除
     * DELETE /api/clue/batch
     */
    @DeleteMapping("/batch")
    @PreAuthorize("hasAuthority('clue:batch')")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        clueService.batchDelete(ids);
        return Result.success();
    }

    /**
     * 线索统计
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<Map<String, Object>> stats() {
        return Result.success(Map.of(
                "total", clueMapper.countTotal(),
                "pending", clueMapper.countPending(),
                "accepted", clueMapper.countAccepted(),
                "converted", clueMapper.countConverted()
        ));
    }

    /**
     * 线索转项目（高风险操作，事务原子执行）
     * POST /api/clue/{id}/convert
     */
    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAuthority('clue:convert')")
    public Result<Map<String, Object>> convert(@PathVariable Long id,
                                               @RequestBody ConvertDTO dto) {
        Long projectId = clueService.convertToProject(id, dto.getProjectName(),
                dto.getProjectManager(), dto.getProjectAmount());
        return Result.success(Map.of("projectId", projectId));
    }

    @Data
    public static class ConvertDTO {
        private String projectName;
        private String projectManager;
        private BigDecimal projectAmount;
    }
}
