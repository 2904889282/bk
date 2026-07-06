package com.beike.platform.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 线索全量详情 VO（含子表数据）
 * v1.5: 增加方案库、资料库、操作日志、跟进记录
 */
@Data
public class ClueFullDetailVO {
    // 线索基础信息复用 ClueVO 字段 + 新增字段
    private Long id;
    private String clueNumber;
    private String clueName;
    private String clientCompany;
    private String clientDept;
    private String clientContact;
    private String beikeOwner;
    private String budget;
    private String clueLevel;
    private String clueStatus;
    private String reviewStatus;
    private String businessConfirmed;
    private String requirementDesc;
    private String painPoint;
    private String expectedTarget;
    private String clueEvaluation;
    private String remark;
    private String deptBelong;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private Long relatedProjectId;
    private Long convertedOpportunityId;
    private Boolean isConverted;
    private String clientCircle;
    private String healthStatus;
    private java.math.BigDecimal opportunityAmount;
    private LocalDateTime lastFollowTime;
    private String convertStatus;
    private Long campaignId;
    private java.time.LocalDate contactDate;
    private java.time.LocalDate proposalDate;
    private java.time.LocalDate createDate;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    // v1.5 新增线索字段
    private String sourceType;
    private String sourceActivityName;
    private String industry;
    private String valueQuadrant;
    private Integer maintenanceFreq;
    private java.time.LocalDate nextMaintenanceDate;
    private String maintenanceMethods;
    private java.math.BigDecimal budgetAmount;
    private String matchedProducts;
    private String recommendedProducts;

    // 子表数据
    private Object campaign;               // 关联战役
    private Object contacts;               // 决策人列表
    private Object followRecords;          // 跟进记录列表 v1.5
    private Object opportunityReviews;     // 商机评审列表
    private Object ironTriangleTasks;      // 铁三角任务列表
    private Object resources;              // 资源协同列表
    private Object solutions;              // 方案库列表 v1.5
    private Object files;                  // 资料库列表 v1.5
    private Object logs;                   // 操作日志列表 v1.5
}
