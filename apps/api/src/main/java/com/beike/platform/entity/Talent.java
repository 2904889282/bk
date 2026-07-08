package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 人才表 - biz_talent
 */
@Data
@TableName("biz_talent")
public class Talent {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;                // 姓名
    private String role;                // 角色
    private String skills;              // 技能标签（逗号分隔）
    private String currentProject;      // 当前项目
    private Integer utilization;        // 利用率(%)
    private String status;              // 状态: normal/high/overload/idle
    private String talentType;          // 类型: internal=内部人员 / external=外部人员

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
