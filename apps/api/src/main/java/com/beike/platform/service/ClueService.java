package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.dto.*;
import com.beike.platform.entity.*;
import com.beike.platform.vo.CampaignDashboardVO;
import com.beike.platform.vo.ClueFullDetailVO;
import com.beike.platform.vo.ClueVO;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface ClueService {

    /** 分页列表（支持关键词/状态/等级/承接人/日期筛选） */
    IPage<ClueVO> page(CluePageDTO dto);

    /** 线索详情 */
    ClueVO detail(Long id);

    /** 新增线索 */
    void create(ClueSaveDTO dto);

    /** 编辑线索 */
    void update(ClueSaveDTO dto, Long id);

    /** 单条逻辑删除 */
    void delete(Long id);

    /** 批量逻辑删除 */
    void batchDelete(List<Long> ids);

    /** 线索转项目：事务内原子执行 */
    Long convertToProject(Long clueId, String projectName, String projectManager, BigDecimal projectAmount);

    // ===== v1.3 新增 =====

    /** 战役看板聚合 */
    CampaignDashboardVO campaignDashboard(Long campaignId);

    /** 线索全量详情（含子表） */
    ClueFullDetailVO fullDetail(Long id);

    /** 发起商机评审 */
    void submitOpportunityReview(Long clueId, OpportunityReviewDTO dto);

    /** 新增决策人 */
    ClueContact addContact(Long clueId, ClueContactSaveDTO dto);

    /** 编辑决策人 */
    ClueContact updateContact(Long clueId, Long contactId, ClueContactSaveDTO dto);

    /** 删除决策人 */
    void deleteContact(Long clueId, Long contactId);

    /** 申请资源 */
    ClueResource applyResource(Long clueId, ClueResourceSaveDTO dto);

    /** 分配铁三角任务 */
    IronTriangleTask assignIronTriangleTask(Long clueId, IronTriangleTaskSaveDTO dto);

    // ===== v1.4 批量操作 + 评审闭环 =====

    /** 评审通过 → 自动创建商机（Pipeline）并返回商机编号 */
    String approveReviewAndCreatePipeline(Long clueId, Long reviewId);

    /** 批量分配责任人 */
    void batchAssign(List<Long> ids, String owner);

    /** 批量调整线索等级 */
    void batchUpdateLevel(List<Long> ids, String level);

    /** 批量划入战役 */
    void batchMoveToCampaign(List<Long> ids, Long campaignId);

    // ===== v1.5 方案库 =====

    /** 新增/更新方案 */
    ClueSolution saveSolution(Long clueId, ClueSolutionSaveDTO dto);

    /** 方案列表 */
    List<ClueSolution> listSolutions(Long clueId);

    /** 删除方案 */
    void deleteSolution(Long clueId, Long solutionId);

    // ===== v1.5 资料库 =====

    /** 上传文件 */
    ClueFile uploadFile(Long clueId, ClueFileSaveDTO dto);

    /** 文件列表 */
    List<ClueFile> listFiles(Long clueId);

    /** 删除文件 */
    void deleteFile(Long clueId, Long fileId);

    /** 沉淀文件至全局资料库 */
    void poolFile(Long clueId, Long fileId);

    // ===== v1.5 操作日志 =====

    /** 查询操作日志 */
    List<ClueLog> listLogs(Long clueId, String actionType);

    // ===== v1.5 导出 =====

    /** 导出周报数据 */
    List<Map<String, Object>> exportWeekReport(List<Long> clueIds);
}
