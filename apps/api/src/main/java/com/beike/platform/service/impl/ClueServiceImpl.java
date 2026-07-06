package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.constant.StageEnum;
import com.beike.platform.dto.*;
import com.beike.platform.entity.*;
import com.beike.platform.mapper.*;
import com.beike.platform.service.ClueHealthService;
import com.beike.platform.service.ClueService;
import com.beike.platform.vo.CampaignDashboardVO;
import com.beike.platform.vo.ClueFullDetailVO;
import com.beike.platform.vo.ClueVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ClueServiceImpl implements ClueService {

    private final ClueMapper clueMapper;
    private final ProjectMapper projectMapper;
    private final ClueContactMapper contactMapper;
    private final ClueOpportunityReviewMapper reviewMapper;
    private final ClueResourceMapper resourceMapper;
    private final IronTriangleTaskMapper ironTriangleMapper;
    private final CampaignMapper campaignMapper;
    private final PipelineMapper pipelineMapper;
    private final ClueHealthService healthService;
    private final ClueSolutionMapper solutionMapper;    // v1.5
    private final ClueLogMapper logMapper;              // v1.5
    private final ClueFileMapper fileMapper;            // v1.5
    private final ClueFollowMapper followMapper;        // v1.5

    @Override
    public IPage<ClueVO> page(CluePageDTO dto) {
        Page<Clue> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        IPage<Clue> result = clueMapper.selectPageWithFilter(page, dto);
        return result.convert(this::toVO);
    }

    @Override
    public ClueVO detail(Long id) {
        Clue clue = clueMapper.selectById(id);
        if (clue == null) throw BizException.notFound("线索");
        return toVO(clue);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(ClueSaveDTO dto) {
        Clue clue = new Clue();
        BeanUtils.copyProperties(dto, clue);
        clue.setCreateDate(LocalDate.now());
        clue.setIsConverted(0);
        clue.setHealthStatus("normal");

        // v1.3: 自动生成线索编号 XS-YYYYMM-NNN
        String monthPrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        int monthCount = clueMapper.countByMonthPrefix(monthPrefix);
        clue.setClueNumber("XS-" + monthPrefix + "-" + String.format("%03d", monthCount + 1));

        clueMapper.insert(clue);

        // v1.5: 操作日志
        writeLog(clue.getId(), "创建", "创建线索：" + clue.getClueName(), "{\"clueName\":\"" + clue.getClueName() + "\",\"clueNumber\":\"" + clue.getClueNumber() + "\"}");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(ClueSaveDTO dto, Long id) {
        // 校验：已转项目的线索不可编辑
        Clue existing = clueMapper.selectById(id);
        if (existing == null) throw BizException.notFound("线索");
        if (existing.getIsConverted() != null && existing.getIsConverted() == 1) {
            throw new BizException("已转项目的线索不可编辑");
        }

        Clue clue = new Clue();
        BeanUtils.copyProperties(dto, clue);
        clue.setId(id);
        clueMapper.updateById(clue);

        // v1.5: 操作日志
        writeLog(id, "编辑", "更新线索：" + existing.getClueName(), "{\"clueStatus\":\"" + dto.getClueStatus() + "\",\"clueLevel\":\"" + dto.getClueLevel() + "\"}");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Clue clue = clueMapper.selectById(id);
        if (clue == null) throw BizException.notFound("线索");
        clueMapper.deleteById(id);  // MyBatis-Plus 逻辑删除
        writeLog(id, "删除", "删除线索：" + clue.getClueName(), null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择要删除的线索");
        clueMapper.deleteBatchIds(ids);  // MyBatis-Plus 批量逻辑删除
        for (Long id : ids) {
            writeLog(id, "批量操作", "批量删除线索", null);
        }
    }

    // ========== v1.3 新增 ==========

    @Override
    public CampaignDashboardVO campaignDashboard(Long campaignId) {
        int target = Math.max(clueMapper.countByCampaign(campaignId), 1);
        int added = clueMapper.countByCampaign(campaignId);
        int valid = clueMapper.countValidByCampaign(campaignId);
        int converted = clueMapper.countConvertedByCampaign(campaignId);
        int yellow = clueMapper.countYellowByCampaign(campaignId);
        int red = clueMapper.countRedByCampaign(campaignId);
        int pending = clueMapper.countPendingByCampaign(campaignId);

        return new CampaignDashboardVO(
                target, added,
                (double) valid / target * 100,
                added > 0 ? (double) converted / added * 100 : 0,
                yellow + red,
                added, pending, yellow, red, pending
        );
    }

    @Override
    public ClueFullDetailVO fullDetail(Long id) {
        Clue clue = clueMapper.selectById(id);
        if (clue == null) throw BizException.notFound("线索");

        ClueFullDetailVO vo = new ClueFullDetailVO();
        BeanUtils.copyProperties(clue, vo);
        vo.setIsConverted(clue.getIsConverted() != null && clue.getIsConverted() == 1);

        // 子表数据
        vo.setContacts(contactMapper.listByClueId(id));
        vo.setOpportunityReviews(reviewMapper.listByClueId(id));
        vo.setIronTriangleTasks(ironTriangleMapper.listByClueId(id));
        vo.setResources(resourceMapper.listByClueId(id));
        if (clue.getCampaignId() != null) {
            vo.setCampaign(campaignMapper.selectById(clue.getCampaignId()));
        }

        // v1.5 新增子表
        vo.setFollowRecords(followMapper.selectByClueId(id));
        vo.setSolutions(solutionMapper.listByClueId(id));
        vo.setFiles(fileMapper.listByClueId(id));
        vo.setLogs(logMapper.listByClueId(id));

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitOpportunityReview(Long clueId, OpportunityReviewDTO dto) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        ClueOpportunityReview review = new ClueOpportunityReview();
        review.setClueId(clueId);
        review.setOpportunityCode("OP-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"))
                + "-" + String.format("%03d", (int)(Math.random() * 1000)));
        review.setOpportunityLevel(clue.getClueLevel());
        review.setExpectedDuration(dto.getExpectedDuration());
        review.setOpinion(dto.getOpinion());
        review.setConclusion("待补充"); // 初始状态，等待评审人确认
        reviewMapper.insert(review);

        // 更新线索商机金额
        if (dto.getOpportunityAmount() != null) {
            Clue update = new Clue();
            update.setId(clueId);
            update.setOpportunityAmount(dto.getOpportunityAmount());
            update.setReviewStatus("评审中");
            clueMapper.updateById(update);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClueContact addContact(Long clueId, ClueContactSaveDTO dto) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        ClueContact contact = new ClueContact();
        BeanUtils.copyProperties(dto, contact);
        contact.setClueId(clueId);
        contactMapper.insert(contact);
        return contact;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClueContact updateContact(Long clueId, Long contactId, ClueContactSaveDTO dto) {
        ClueContact contact = contactMapper.selectById(contactId);
        if (contact == null || !contact.getClueId().equals(clueId)) throw BizException.notFound("决策人");

        BeanUtils.copyProperties(dto, contact, "id", "clueId", "createBy", "createTime");
        contactMapper.updateById(contact);
        return contact;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteContact(Long clueId, Long contactId) {
        ClueContact contact = contactMapper.selectById(contactId);
        if (contact == null || !contact.getClueId().equals(clueId)) throw BizException.notFound("决策人");
        contactMapper.deleteById(contactId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClueResource applyResource(Long clueId, ClueResourceSaveDTO dto) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        ClueResource resource = new ClueResource();
        resource.setClueId(clueId);
        resource.setResourceType(dto.getResourceType());
        resource.setStatus("PENDING");
        resource.setApplyTime(LocalDateTime.now());
        resource.setEffectNotes(dto.getEffectNotes());
        resourceMapper.insert(resource);
        return resource;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public IronTriangleTask assignIronTriangleTask(Long clueId, IronTriangleTaskSaveDTO dto) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        IronTriangleTask task = new IronTriangleTask();
        BeanUtils.copyProperties(dto, task);
        task.setClueId(clueId);
        task.setStatus("TODO");
        ironTriangleMapper.insert(task);
        return task;
    }

    // ========== 内部方法 ==========

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long convertToProject(Long clueId, String projectName, String projectManager, BigDecimal projectAmount) {
        // 1. 校验线索存在且状态为已承接，未转项目
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");
        if (!"承接".equals(clue.getClueStatus()) && !"已承接".equals(clue.getClueStatus())) {
            throw new BizException("仅承接状态的线索可以转为项目，当前状态：" + clue.getClueStatus());
        }
        if (clue.getIsConverted() != null && clue.getIsConverted() == 1) {
            throw new BizException("该线索已转为项目，不可重复操作");
        }

        // 2. 字段映射：创建项目（严格按数据模型文档）
        Project project = new Project();
        project.setProjectName(projectName != null ? projectName : clue.getClueName());
        project.setClientName(clue.getClientCompany());
        project.setProjectManager(projectManager != null ? projectManager : clue.getBeikeOwner());
        project.setProjectAmount(projectAmount);
        project.setProjectStatus("进行中");
        project.setProgress(0);
        project.setStartDate(LocalDate.now());
        project.setProjectLevel(clue.getClueLevel());
        project.setDeptBelong(clue.getDeptBelong());
        project.setSourceClueId(clueId);
        project.setArUserId(clue.getArUserId());
        project.setSrUserId(clue.getSrUserId());
        project.setFrUserId(clue.getFrUserId());
        project.setDescription(clue.getRequirementDesc());
        project.setRiskCount(0);
        projectMapper.insert(project);

        // 3. 更新线索：标记已转 + 回填项目ID
        Clue update = new Clue();
        update.setId(clueId);
        update.setClueStatus("已转项目");
        update.setIsConverted(1);
        update.setRelatedProjectId(project.getId());
        clueMapper.updateById(update);

        // v1.5: 操作日志
        writeLog(clueId, "转项目", "线索转项目成功，项目ID：" + project.getId(), "{\"projectId\":" + project.getId() + "}");

        return project.getId();
    }

    // ========== v1.4 评审闭环 + 批量操作 ==========

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String approveReviewAndCreatePipeline(Long clueId, Long reviewId) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        ClueOpportunityReview review = reviewMapper.selectById(reviewId);
        if (review == null) throw BizException.notFound("评审记录");

        // 1. 更新评审结论为"通过"，生成商机编号
        String oppCode = "OP-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"))
                + "-" + String.format("%03d", (int)(Math.random() * 1000));
        review.setConclusion("通过");
        review.setOpportunityCode(oppCode);
        reviewMapper.updateById(review);

        // 2. 在 biz_pipeline 创建商机记录
        Pipeline pipeline = new Pipeline();
        pipeline.setName(clue.getClueName() + "（商机）");
        pipeline.setCustomer(clue.getClientCompany());
        pipeline.setAmount(review.getExpectedDuration() != null
                ? BigDecimal.valueOf(review.getExpectedDuration() * 10000) : BigDecimal.ZERO);
        pipeline.setStage(StageEnum.LEAD.getCode());
        pipeline.setWinRate(50);
        pipeline.setIsSea(0);
        pipeline.setDescription(clue.getRequirementDesc());
        pipelineMapper.insert(pipeline);

        // 3. 更新线索：标记已转商机
        Clue update = new Clue();
        update.setId(clueId);
        update.setReviewStatus("通过");
        update.setConvertStatus("converted");
        update.setIsConverted(1);
        update.setConvertedOpportunityId(pipeline.getId());
        clueMapper.updateById(update);

        return oppCode;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchAssign(List<Long> ids, String owner) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择线索");
        for (Long id : ids) {
            Clue update = new Clue();
            update.setId(id);
            update.setBeikeOwner(owner);
            clueMapper.updateById(update);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateLevel(List<Long> ids, String level) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择线索");
        for (Long id : ids) {
            Clue update = new Clue();
            update.setId(id);
            update.setClueLevel(level);
            clueMapper.updateById(update);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchMoveToCampaign(List<Long> ids, Long campaignId) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择线索");
        for (Long id : ids) {
            Clue update = new Clue();
            update.setId(id);
            update.setCampaignId(campaignId);
            clueMapper.updateById(update);
        }
    }

    private ClueVO toVO(Clue clue) {
        ClueVO vo = new ClueVO();
        BeanUtils.copyProperties(clue, vo);
        vo.setIsConverted(clue.getIsConverted() != null && clue.getIsConverted() == 1);
        return vo;
    }

    // ================================================================
    // v1.5 新增方法
    // ================================================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClueSolution saveSolution(Long clueId, ClueSolutionSaveDTO dto) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        ClueSolution solution = new ClueSolution();
        BeanUtils.copyProperties(dto, solution);
        solution.setClueId(clueId);
        solution.setVersion(1);
        solution.setIsCurrent(1);
        solutionMapper.insert(solution);

        writeLog(clueId, "资料上传", "新增方案：" + dto.getTitle(), null);
        return solution;
    }

    @Override
    public List<ClueSolution> listSolutions(Long clueId) {
        return solutionMapper.listByClueId(clueId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteSolution(Long clueId, Long solutionId) {
        ClueSolution solution = solutionMapper.selectById(solutionId);
        if (solution == null || !solution.getClueId().equals(clueId))
            throw BizException.notFound("方案");
        solutionMapper.deleteById(solutionId);
        writeLog(clueId, "资料删除", "删除方案：" + solution.getTitle(), null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClueFile uploadFile(Long clueId, ClueFileSaveDTO dto) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null) throw BizException.notFound("线索");

        ClueFile file = new ClueFile();
        BeanUtils.copyProperties(dto, file);
        file.setClueId(clueId);
        file.setIsPool(0);
        fileMapper.insert(file);

        writeLog(clueId, "资料上传", "上传文件：" + dto.getFileName(), null);
        return file;
    }

    @Override
    public List<ClueFile> listFiles(Long clueId) {
        return fileMapper.listByClueId(clueId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFile(Long clueId, Long fileId) {
        ClueFile file = fileMapper.selectById(fileId);
        if (file == null || !file.getClueId().equals(clueId))
            throw BizException.notFound("文件");
        fileMapper.deleteById(fileId);
        writeLog(clueId, "资料删除", "删除文件：" + file.getFileName(), null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void poolFile(Long clueId, Long fileId) {
        ClueFile file = fileMapper.selectById(fileId);
        if (file == null || !file.getClueId().equals(clueId))
            throw BizException.notFound("文件");

        ClueFile update = new ClueFile();
        update.setId(fileId);
        update.setIsPool(1);
        fileMapper.updateById(update);

        writeLog(clueId, "资料上传", "沉淀文件至全局资料库：" + file.getFileName(), null);
    }

    @Override
    public List<ClueLog> listLogs(Long clueId, String actionType) {
        if (actionType != null && !actionType.isEmpty()) {
            return logMapper.listByClueIdAndType(clueId, actionType);
        }
        return logMapper.listByClueId(clueId);
    }

    @Override
    public List<Map<String, Object>> exportWeekReport(List<Long> clueIds) {
        if (clueIds == null || clueIds.isEmpty()) return List.of();
        return clueIds.stream().map(id -> {
            Clue clue = clueMapper.selectById(id);
            Map<String, Object> row = new LinkedHashMap<>();
            if (clue == null) {
                row.put("id", id);
                row.put("error", "not_found");
                return row;
            }
            row.put("clueNumber", clue.getClueNumber());
            row.put("clueName", clue.getClueName());
            row.put("clientCompany", clue.getClientCompany());
            row.put("clientCircle", clue.getClientCircle());
            row.put("clueStatus", clue.getClueStatus());
            row.put("clueLevel", clue.getClueLevel());
            row.put("beikeOwner", clue.getBeikeOwner());
            row.put("healthStatus", clue.getHealthStatus());
            row.put("lastFollowTime", clue.getLastFollowTime());
            row.put("opportunityAmount", clue.getOpportunityAmount());
            return row;
        }).toList();
    }

    // ================================================================
    // 内部辅助方法
    // ================================================================

    private void writeLog(Long clueId, String actionType, String summary, String detailJson) {
        try {
            ClueLog log = new ClueLog();
            log.setClueId(clueId);
            log.setActionType(actionType);
            log.setActionSummary(summary);
            log.setDetailJson(detailJson);
            log.setCreateTime(LocalDateTime.now());
            logMapper.insert(log);
        } catch (Exception e) {
            // 日志写入失败不影响主流程
        }
    }
}
