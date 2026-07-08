package com.beike.platform.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProjectPeriodSaveDTO {
    private Long projectId;
    private String periodMonth;
    private String periodStatus;
    private BigDecimal estimatedRevenue;
    private BigDecimal estimatedProfit;
    private String estimatedProfitRate;
    private BigDecimal estimatedCost;
    private BigDecimal estimatedLaborCost;
    private BigDecimal actualRevenue;
    private BigDecimal actualProfit;
    private String actualProfitRate;
    private BigDecimal actualCost;
    private BigDecimal actualLaborCost;
    private String profitAchievementRate;
    private String goalDescription;
    private String monthlyTarget;
    private String monthlyActual;
    private String monthlyProgress;
    private String goalSummary;
    private String w1Target; private String w1Actual; private String w1Progress;
    private String w2Target; private String w2Actual; private String w2Progress;
    private String w3Target; private String w3Actual; private String w3Progress;
    private String w4Target; private String w4Actual; private String w4Progress;
    private String personnel;
    private String milestones;
    private String processBonus;
    private String resultBonus;
    private String alertText;
    private String progressInterpretation;
    private String monthlyProfitExpectation;
    private String executionStaff;
    private String customerInfo;
    private String riskAssessment;
    private String supplier;
}
