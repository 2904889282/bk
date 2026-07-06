package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 预警表 - biz_alert
 */
@Data
@TableName("biz_alert")
public class Alert {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;             // 关联项目ID
    private String type;                // 预警类型
    private String level;               // 严重程度: high/medium
    private String description;         // 问题描述
    private String manager;             // 负责人
    private String status;              // 状态: open/resolved

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
