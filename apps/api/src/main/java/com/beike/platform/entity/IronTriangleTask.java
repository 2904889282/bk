package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 铁三角任务表
 */
@Data
@TableName("biz_iron_triangle_task")
public class IronTriangleTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private String role;        // AR/SR/FR
    private Long assigneeId;
    private String taskTitle;
    private String status;      // TODO/DOING/DONE
    private LocalDate deadline;
    private String deliverable;

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
