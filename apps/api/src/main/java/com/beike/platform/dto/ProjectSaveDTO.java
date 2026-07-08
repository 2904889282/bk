package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProjectSaveDTO {
    @NotBlank(message = "项目名称不能为空")
    private String projectName;
    private String projectNumber;
    private String clientName;
    private String clientContact;
    private String projectManager;
    private String deliveryManager;
    private String productManager;
    private BigDecimal projectAmount;
    @NotBlank(message = "项目状态不能为空")
    private String projectStatus;
    private Integer progress;
    private LocalDate startDate;
    private LocalDate expectEndDate;
    private String stage;
    private String projectLevel;
    private String deptBelong;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private String supplier;
    private String riskAssessment;
    private String remark;
    private String description;
}
