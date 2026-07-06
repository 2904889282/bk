package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

/** 跟进记录新增/编辑请求体 */
@Data
public class FollowSaveDTO {

    @NotNull(message = "线索ID不能为空")
    private Long clueId;

    // 跟进日期由后端自动填充（当前时间），前端无需传入
    @NotBlank(message = "跟进类型不能为空")
    private String followType;

    @NotBlank(message = "核心结论不能为空")
    private String coreConclusion;

    private String detailContent;
    private String nextPlan;

    @NotNull(message = "下次跟进时间不能为空")
    private LocalDate nextDeadline;

    @NotBlank(message = "对接人不能为空")
    private String contactPerson;       // v1.5: 对接人姓名
    private String weeklyReviewNotes;   // v1.5: 周度评审指导意见

    /** 同步修改线索状态（可选），非空时触发状态变更 */
    private String newStatus;

    /** 状态变更原因：newStatus 非空时必填 */
    private String statusChangeReason;

    /** 下次跟进超过14天时，前端二次确认后传 true */
    private Boolean confirmLongInterval;
}
