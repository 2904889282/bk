package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/** 线索新增/编辑请求体 */
@Data
public class ClueSaveDTO {
    @NotBlank(message = "线索名称不能为空")
    private String clueName;

    @NotBlank(message = "甲方公司不能为空")
    private String clientCompany;

    private String clientDept;
    private String clientContact;

    private String beikeOwner; // 后端自动填充：普通用户取当前用户名

    private String budget;
    private BigDecimal budgetAmount;    // v1.5: 预算范围(万)

    @NotBlank(message = "项目等级不能为空")
    private String clueLevel;

    @NotBlank(message = "线索状态不能为空")
    private String clueStatus;

    private String reviewStatus;
    private String businessConfirmed;
    private LocalDate contactDate;
    private LocalDate proposalDate;
    private LocalDate createDate;
    private String requirementDesc;
    private String painPoint;           // v1.5: 客户痛点
    private String expectedTarget;      // v1.5: 预期目标
    private String clueEvaluation;
    private String remark;

    @NotBlank(message = "承接部门不能为空")
    private String deptBelong;

    private String commRecord1;
    private String commRecord2;
    private String commRecord3;
    private String commRecord4;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private String relation1;
    private String relation2;
    private String relation3;

    // ===== v1.3 新增 =====
    private Long campaignId;
    private String clientCircle;
    private String healthStatus;
    private BigDecimal opportunityAmount;

    // ===== v1.5 新增 =====
    private String sourceType;              // 线索来源
    private String sourceActivityName;      // 来源活动名称
    private String industry;                // 所属行业
    private String valueQuadrant;           // 价值象限
    private Integer maintenanceFreq;        // 维护频率(天)
    private LocalDate nextMaintenanceDate;  // 下次维护时间
    private String maintenanceMethods;      // 维护方式
    private String matchedProducts;         // 匹配产品等级
    private String recommendedProducts;     // 推荐核心产品
}
