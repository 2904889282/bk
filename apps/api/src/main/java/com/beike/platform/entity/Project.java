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
    private String projectNumber;       // 项目编号
    private String clientName;
    private String clientContact;       // 甲方对接人
    private String projectManager;      // 一条龙经理
    private String deliveryManager;     // 交付经理
    private String productManager;      // 产品经理
    private BigDecimal projectAmount;
    private String projectLevel;        // S/A/B/C
    private String projectStatus;       // 进行中/暂停/已交付/已终止
    private String deptBelong;
    private LocalDate startDate;
    private LocalDate expectEndDate;
    private LocalDate actualEndDate;
    private Integer progress;
    private Long sourceClueId;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private String supplier;            // 供应商
    private String riskAssessment;      // 风险评估
    private String remark;
    private String stage;
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
