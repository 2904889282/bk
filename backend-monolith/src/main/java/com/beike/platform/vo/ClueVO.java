package com.beike.platform.vo;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** 线索列表/详情返回对象 */
@Data
public class ClueVO {
    private Long id;
    private String clueName;
    private String clientCompany;
    private String clientDept;
    private String clientContact;
    private String beikeOwner;
    private String budget;
    private String clueLevel;
    private String clueStatus;
    private String reviewStatus;
    private String businessConfirmed;
    private LocalDate contactDate;
    private LocalDate proposalDate;
    private LocalDate createDate;
    private String requirementDesc;
    private String clueEvaluation;
    private String remark;
    private String deptBelong;
    private String commRecord1;
    private String commRecord2;
    private String commRecord3;
    private String commRecord4;
    private Long arUserId;
    private Long srUserId;
    private Long frUserId;
    private Long relatedProjectId;
    private Boolean isConverted;
    private LocalDate expectedRestart;
    private String relation1;
    private String relation2;
    private String relation3;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
