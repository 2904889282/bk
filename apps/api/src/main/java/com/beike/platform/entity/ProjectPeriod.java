package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 项目月度期数表 - biz_project_period */
@Data
@TableName("biz_project_period")
public class ProjectPeriod {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String periodMonth;
    private String periodStatus;
    // 营收预计
    private BigDecimal estimatedRevenue;
    private BigDecimal estimatedProfit;
    private String estimatedProfitRate;
    private BigDecimal estimatedCost;
    private BigDecimal estimatedLaborCost;
    // 营收实际
    private BigDecimal actualRevenue;
    private BigDecimal actualProfit;
    private String actualProfitRate;
    private BigDecimal actualCost;
    private BigDecimal actualLaborCost;
    private String profitAchievementRate;
    // 关键目标
    private String goalDescription;
    private String monthlyTarget;
    private String monthlyActual;
    private String monthlyProgress;
    private String goalSummary;
    // 四周
    private String w1Target; private String w1Actual; private String w1Progress;
    private String w2Target; private String w2Actual; private String w2Progress;
    private String w3Target; private String w3Actual; private String w3Progress;
    private String w4Target; private String w4Actual; private String w4Progress;
    // JSON
    private String personnel;
    private String milestones;
    private String processBonus;
    private String resultBonus;
    // 预警
    private String alertText;
    private String progressInterpretation;
    private String monthlyProfitExpectation;
    // 其他
    private String executionStaff;
    private String customerInfo;
    private String riskAssessment;
    private String supplier;

    @TableField(fill = FieldFill.INSERT)
    private Long createBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updateBy;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer isDeleted;
}
