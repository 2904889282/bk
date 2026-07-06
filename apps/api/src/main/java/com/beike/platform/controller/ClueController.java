package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.common.Result;
import com.beike.platform.dto.*;
import com.beike.platform.entity.ClueFile;
import com.beike.platform.entity.ClueLog;
import com.beike.platform.entity.ClueSolution;
import com.beike.platform.mapper.CampaignMapper;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.service.ClueService;
import com.beike.platform.vo.CampaignDashboardVO;
import com.beike.platform.vo.ClueFullDetailVO;
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
    private final CampaignMapper campaignMapper;

    /**
     * 线索分页列表
     */
    @GetMapping("/page")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<IPage<ClueVO>> page(CluePageDTO dto) {
        return Result.success(clueService.page(dto));
    }

    /**
     * 线索详情
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<ClueVO> detail(@PathVariable Long id) {
        return Result.success(clueService.detail(id));
    }

    /**
     * 新增线索
     */
    @PostMapping
    @PreAuthorize("hasAuthority('clue:create')")
    public Result<Void> create(@Valid @RequestBody ClueSaveDTO dto) {
        clueService.create(dto);
        return Result.success();
    }

    /**
     * 编辑线索
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody ClueSaveDTO dto) {
        clueService.update(dto, id);
        return Result.success();
    }

    /**
     * 单条逻辑删除
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('clue:delete')")
    public Result<Void> delete(@PathVariable Long id) {
        clueService.delete(id);
        return Result.success();
    }

    /**
     * 批量逻辑删除
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
     * 线索转项目
     */
    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAuthority('clue:convert')")
    public Result<Map<String, Object>> convert(@PathVariable Long id,
                                               @RequestBody ConvertDTO dto) {
        Long projectId = clueService.convertToProject(id, dto.getProjectName(),
                dto.getProjectManager(), dto.getProjectAmount());
        return Result.success(Map.of("projectId", projectId));
    }

    // ================================================================
    // v1.3 新增端点
    // ================================================================

    /**
     * 战役看板聚合数据
     * GET /api/clue/campaign/dashboard?campaignId=1
     */
    @GetMapping("/campaign/dashboard")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<CampaignDashboardVO> campaignDashboard(@RequestParam Long campaignId) {
        return Result.success(clueService.campaignDashboard(campaignId));
    }

    /**
     * 线索全量详情（含客户档案、跟进记录、评审记录、铁三角任务、资源记录）
     * GET /api/clue/{id}/full-detail
     */
    @GetMapping("/{id}/full-detail")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<ClueFullDetailVO> fullDetail(@PathVariable Long id) {
        return Result.success(clueService.fullDetail(id));
    }

    /**
     * 发起商机评审
     * POST /api/clue/{id}/opportunity-review
     */
    @PostMapping("/{id}/opportunity-review")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> submitOpportunityReview(@PathVariable Long id,
                                                @Valid @RequestBody OpportunityReviewDTO dto) {
        clueService.submitOpportunityReview(id, dto);
        return Result.success();
    }

    /**
     * 新增决策人
     * POST /api/clue/{id}/contacts
     */
    @PostMapping("/{id}/contacts")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<?> addContact(@PathVariable Long id,
                                @Valid @RequestBody ClueContactSaveDTO dto) {
        return Result.success(clueService.addContact(id, dto));
    }

    /**
     * 编辑决策人
     * PUT /api/clue/{id}/contacts/{contactId}
     */
    @PutMapping("/{id}/contacts/{contactId}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<?> updateContact(@PathVariable Long id,
                                   @PathVariable Long contactId,
                                   @Valid @RequestBody ClueContactSaveDTO dto) {
        return Result.success(clueService.updateContact(id, contactId, dto));
    }

    /**
     * 删除决策人
     * DELETE /api/clue/{id}/contacts/{contactId}
     */
    @DeleteMapping("/{id}/contacts/{contactId}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> deleteContact(@PathVariable Long id,
                                      @PathVariable Long contactId) {
        clueService.deleteContact(id, contactId);
        return Result.success();
    }

    /**
     * 申请资源
     * POST /api/clue/{id}/resources
     */
    @PostMapping("/{id}/resources")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<?> applyResource(@PathVariable Long id,
                                   @Valid @RequestBody ClueResourceSaveDTO dto) {
        return Result.success(clueService.applyResource(id, dto));
    }

    /**
     * 分配铁三角任务
     * POST /api/clue/{id}/iron-triangle
     */
    @PostMapping("/{id}/iron-triangle")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<?> assignIronTriangleTask(@PathVariable Long id,
                                            @Valid @RequestBody IronTriangleTaskSaveDTO dto) {
        return Result.success(clueService.assignIronTriangleTask(id, dto));
    }

    /** 可用战役列表（供前端下拉） */
    @GetMapping("/campaigns")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<?> listCampaigns() {
        return Result.success(campaignMapper.listActive());
    }

    // ================================================================
    // v1.4 评审闭环 + 批量操作
    // ================================================================

    /**
     * 评审通过 → 自动创建商机
     * PUT /api/clue/{id}/review/{reviewId}/approve
     */
    @PutMapping("/{id}/review/{reviewId}/approve")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Map<String, Object>> approveReview(@PathVariable Long id,
                                                      @PathVariable Long reviewId) {
        String oppCode = clueService.approveReviewAndCreatePipeline(id, reviewId);
        return Result.success(Map.of("opportunityCode", oppCode));
    }

    /**
     * 批量分配责任人
     * PUT /api/clue/batch/assign
     */
    @PutMapping("/batch/assign")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> batchAssign(@RequestBody BatchAssignDTO dto) {
        clueService.batchAssign(dto.getIds(), dto.getOwner());
        return Result.success();
    }

    /**
     * 批量调整等级
     * PUT /api/clue/batch/level
     */
    @PutMapping("/batch/level")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> batchUpdateLevel(@RequestBody BatchLevelDTO dto) {
        clueService.batchUpdateLevel(dto.getIds(), dto.getLevel());
        return Result.success();
    }

    /**
     * 批量划入战役
     * PUT /api/clue/batch/campaign
     */
    @PutMapping("/batch/campaign")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> batchMoveToCampaign(@RequestBody BatchCampaignDTO dto) {
        clueService.batchMoveToCampaign(dto.getIds(), dto.getCampaignId());
        return Result.success();
    }

    @Data
    public static class ConvertDTO {
        private String projectName;
        private String projectManager;
        private BigDecimal projectAmount;
    }

    @Data
    public static class BatchAssignDTO {
        private List<Long> ids;
        private String owner;
    }

    @Data
    public static class BatchLevelDTO {
        private List<Long> ids;
        private String level;
    }

    @Data
    public static class BatchCampaignDTO {
        private List<Long> ids;
        private Long campaignId;
    }

    // ================================================================
    // v1.5 方案库端点
    // ================================================================

    /** 方案列表 */
    @GetMapping("/{id}/solutions")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<List<ClueSolution>> listSolutions(@PathVariable Long id) {
        return Result.success(clueService.listSolutions(id));
    }

    /** 新增方案 */
    @PostMapping("/{id}/solutions")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<ClueSolution> saveSolution(@PathVariable Long id,
                                             @Valid @RequestBody ClueSolutionSaveDTO dto) {
        return Result.success(clueService.saveSolution(id, dto));
    }

    /** 删除方案 */
    @DeleteMapping("/{id}/solutions/{solutionId}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> deleteSolution(@PathVariable Long id,
                                       @PathVariable Long solutionId) {
        clueService.deleteSolution(id, solutionId);
        return Result.success();
    }

    // ================================================================
    // v1.5 资料库端点
    // ================================================================

    /** 文件列表 */
    @GetMapping("/{id}/files")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<List<ClueFile>> listFiles(@PathVariable Long id) {
        return Result.success(clueService.listFiles(id));
    }

    /** 上传文件 */
    @PostMapping("/{id}/files")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<ClueFile> uploadFile(@PathVariable Long id,
                                       @Valid @RequestBody ClueFileSaveDTO dto) {
        return Result.success(clueService.uploadFile(id, dto));
    }

    /** 删除文件 */
    @DeleteMapping("/{id}/files/{fileId}")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> deleteFile(@PathVariable Long id,
                                   @PathVariable Long fileId) {
        clueService.deleteFile(id, fileId);
        return Result.success();
    }

    /** 沉淀文件至全局资料库 */
    @PutMapping("/{id}/files/{fileId}/pool")
    @PreAuthorize("hasAuthority('clue:edit')")
    public Result<Void> poolFile(@PathVariable Long id,
                                 @PathVariable Long fileId) {
        clueService.poolFile(id, fileId);
        return Result.success();
    }

    // ================================================================
    // v1.5 操作日志端点
    // ================================================================

    /** 查询操作日志 */
    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<List<ClueLog>> listLogs(@PathVariable Long id,
                                          @RequestParam(required = false) String actionType) {
        return Result.success(clueService.listLogs(id, actionType));
    }

    // ================================================================
    // v1.5 导出端点
    // ================================================================

    /** 导出周报数据 */
    @PostMapping("/export-weekly")
    @PreAuthorize("hasAuthority('clue:list')")
    public Result<List<Map<String, Object>>> exportWeekReport(@RequestBody List<Long> clueIds) {
        return Result.success(clueService.exportWeekReport(clueIds));
    }
}
