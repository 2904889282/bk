package com.beike.platform.vo;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 跟进记录返回对象 */
@Data
public class FollowVO {
    private Long id;
    private Long clueId;
    private String followType;
    private LocalDateTime followDate;
    private Long followUserId;
    private String followUserName;
    private String coreConclusion;
    private String detailContent;
    private String nextPlan;
    private LocalDate nextDeadline;
    private String newStatus;
    private LocalDateTime createTime;
}
