package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 战役表
 */
@Data
@TableName("biz_campaign")
public class Campaign {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer targetCount;
    private java.math.BigDecimal targetAmount;   // v1.5: 目标金额
    private String status;  // ACTIVE/COMPLETED/PAUSED
    private String description;                  // v1.5: 战役描述
    private String priority;                     // v1.5: 优先级 HIGH/NORMAL
    private String managerName;                  // v1.5: 战役负责人

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
