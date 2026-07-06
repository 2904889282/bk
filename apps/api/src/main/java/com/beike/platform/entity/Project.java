package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 项目表 - 对齐 biz_project */
@Data
@TableName("biz_project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String projectName;
    private String clientName;
    private String projectManager;
    private BigDecimal projectAmount;
    private String projectStatus;       // 进行中/已完成/已暂停
    private Integer progress;
    private LocalDate startDate;
    private LocalDate expectedEnd;
    private LocalDate actualEnd;
    private String stage;               // 立项/计划/执行/监控/收尾
    private String projectLevel;        // A/B/C
    private String deptBelong;
    private Long sourceClueId;          // 来源线索ID
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private Integer riskCount;
    private String description;

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
