package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 跟进记录表 - 严格对齐 biz_clue_follow
 */
@Data
@TableName("biz_clue_follow")
public class ClueFollow {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;            // 关联线索ID
    private String followType;      // 跟进类型：初次沟通/二次沟通/三次沟通/日常跟进/状态变更
    private LocalDateTime followDate; // 跟进日期
    private Long followUserId;      // 跟进人ID
    private String followUserName;  // 跟进人姓名
    private String contactPerson;   // v1.5: 对接人姓名
    private String coreConclusion;  // 核心结论
    private String detailContent;   // 详细内容
    private String nextPlan;        // 下一步计划
    private LocalDate nextDeadline; // 下一步截止日期
    private String newStatus;       // 状态变更（旧状态→新状态）
    private String weeklyReviewNotes; // v1.5: 周度评审指导意见
    private String attachmentUrls;    // v1.5: 附件URL(JSON数组)

    // 审计字段
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
