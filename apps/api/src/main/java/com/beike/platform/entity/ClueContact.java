package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 客户决策人表
 */
@Data
@TableName("biz_clue_contact")
public class ClueContact {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private String name;
    private String position;
    private String level;       // 决策层/管理层/执行层
    private String contactInfo;
    private String attitude;    // 支持/中立/反对
    private String remarks;

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
