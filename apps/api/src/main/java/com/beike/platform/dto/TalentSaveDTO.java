package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** 人才新增/编辑请求体 */
@Data
public class TalentSaveDTO {

    @NotBlank(message = "姓名不能为空")
    private String name;

    private String role;                // 角色
    private String skills;              // 技能标签
    private String currentProject;      // 当前项目
    private Integer utilization;        // 利用率(%)
    private String status;              // 状态
    private String talentType;          // 类型: internal/external
}
