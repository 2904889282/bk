package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 线索表 - 严格对齐统一数据模型 biz_clue
 */
@Data
@TableName("biz_clue")
public class Clue {

    @TableId(type = IdType.AUTO)
    private Long id;

    // ========== 核心基础 ==========
    private String clueName;            // 线索名称
    private String clientCompany;       // 甲方公司
    private String clientDept;          // 甲方部门
    private String clientContact;       // 甲方对接人
    private String beikeOwner;          // 承接人
    private String budget;              // 预算量级
    private String clueLevel;           // 项目等级 A/B/C

    // ========== 状态流程 ==========
    private String clueStatus;          // 线索状态
    private String reviewStatus;        // 评审状态
    private String businessConfirmed;   // 确认商机

    // ========== 时间 ==========
    private LocalDate contactDate;      // 接触日期
    private LocalDate proposalDate;     // 提案日期
    private LocalDate createDate;       // 线索创建日期

    // ========== 详情 ==========
    private String requirementDesc;     // 线索需求详细说明
    private String clueEvaluation;      // 线索评价
    private String remark;              // 备注

    // ========== 部门 ==========
    private String deptBelong;          // 承接部门

    // ========== 沟通记录 ==========
    @TableField("comm_record_1")
    private String commRecord1;
    @TableField("comm_record_2")
    private String commRecord2;
    @TableField("comm_record_3")
    private String commRecord3;
    @TableField("comm_record_4")
    private String commRecord4;

    // ========== 铁三角 ==========
    private Long arUserId;              // AR
    private Long srUserId;              // SR
    private Long frUserId;              // FR

    // ========== 关联/转换 ==========
    private Long relatedProjectId;      // 关联项目ID
    private Integer isConverted;        // 是否已转项目
    private LocalDate expectedRestart;  // 预计重启时间（已延期）

    // ========== 关联 ==========
    @TableField("relation_1")
    private String relation1;
    @TableField("relation_2")
    private String relation2;
    @TableField("relation_3")
    private String relation3;

    // ========== 审计字段（框架自动） ==========
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
