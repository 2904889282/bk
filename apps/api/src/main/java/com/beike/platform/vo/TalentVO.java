package com.beike.platform.vo;

import lombok.Data;
import java.time.LocalDateTime;

/** 人才列表/详情返回对象 */
@Data
public class TalentVO {
    private Long id;
    private String name;
    private String role;
    private String skills;
    private String currentProject;
    private Integer utilization;
    private String status;
    private String talentType;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
