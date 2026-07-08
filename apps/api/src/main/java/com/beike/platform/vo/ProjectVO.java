package com.beike.platform.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProjectVO {
    private Long id;
    private String projectName;
    private String projectNumber;
    private String clientName;
    private String clientContact;
    private String projectManager;
    private String deliveryManager;
    private String productManager;
    private BigDecimal projectAmount;
    private String projectLevel;
    private String projectStatus;
    private String deptBelong;
    private LocalDate startDate;
    private LocalDate expectEndDate;
    private LocalDate actualEndDate;
    private Integer progress;
    private Long sourceClueId;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private String supplier;
    private String riskAssessment;
    private String remark;
    private String stage;
    private String description;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
