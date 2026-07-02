package com.beike.platform.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProjectVO {
    private Long id;
    private String projectName;
    private String clientName;
    private String projectManager;
    private BigDecimal projectAmount;
    private String projectStatus;
    private Integer progress;
    private LocalDate startDate;
    private LocalDate expectedEnd;
    private LocalDate actualEnd;
    private String stage;
    private String projectLevel;
    private String deptBelong;
    private Long sourceClueId;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private Integer riskCount;
    private String description;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
