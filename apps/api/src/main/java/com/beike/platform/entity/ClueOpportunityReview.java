package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 商机评审表
 */
@Data
@TableName("biz_clue_opportunity_review")
public class ClueOpportunityReview {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private Long reviewerId;
    private String conclusion;          // 通过/驳回/待补充
    private String opinion;
    private String opportunityCode;     // OP-YYYYMM-NNN
    private String opportunityLevel;    // S/A/B/C
    private Integer expectedDuration;   // 预计成交周期(天)

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
