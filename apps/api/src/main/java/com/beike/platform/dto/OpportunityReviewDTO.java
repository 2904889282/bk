package com.beike.platform.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 商机评审请求体
 */
@Data
public class OpportunityReviewDTO {
    private BigDecimal opportunityAmount;   // 预计商机金额
    private Integer expectedDuration;       // 预计成交周期(天)
    private String opinion;                 // 评审意见/分析说明
}
