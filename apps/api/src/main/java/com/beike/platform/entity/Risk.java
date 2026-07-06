package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 风险表 - biz_risk
 */
@Data
@TableName("biz_risk")
public class Risk {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long projectId;             // 关联项目ID
    private String type;                // 风险项
    private String level;               // 影响等级: high/medium/low
    private String description;         // 风险描述
    private String solution;            // 应对措施
    private String owner;               // 负责人
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
