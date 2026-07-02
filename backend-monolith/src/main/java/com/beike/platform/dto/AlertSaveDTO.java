package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** 预警新增/编辑请求体 */
@Data
public class AlertSaveDTO {

    @NotNull(message = "关联项目不能为空")
    private Long projectId;

    @NotBlank(message = "预警类型不能为空")
    private String type;

    @NotBlank(message = "严重程度不能为空")
    private String level;               // high/medium

    private String description;         // 问题描述
    private String manager;             // 负责人
}
