package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

/** 线索新增/编辑请求体 */
@Data
public class ClueSaveDTO {
    @NotBlank(message = "线索名称不能为空")
    private String clueName;

    @NotBlank(message = "甲方公司不能为空")
    private String clientCompany;

    private String clientDept;
    private String clientContact;

    @NotBlank(message = "承接人不能为空")
    private String beikeOwner;

    private String budget;

    @NotBlank(message = "项目等级不能为空")
    private String clueLevel;

    @NotBlank(message = "线索状态不能为空")
    private String clueStatus;

    private String reviewStatus;
    private String businessConfirmed;
    private LocalDate contactDate;
    private LocalDate proposalDate;
    private LocalDate createDate;
    private String requirementDesc;
    private String clueEvaluation;
    private String remark;

    @NotBlank(message = "承接部门不能为空")
    private String deptBelong;

    private String commRecord1;
    private String commRecord2;
    private String commRecord3;
    private String commRecord4;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private String relation1;
    private String relation2;
    private String relation3;
}
