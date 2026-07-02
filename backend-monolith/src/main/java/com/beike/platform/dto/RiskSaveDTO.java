package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** 风险新增/编辑请求体 */
@Data
public class RiskSaveDTO {

    @NotNull(message = "关联项目不能为空")
    private Long projectId;

    @NotBlank(message = "风险项不能为空")
    private String type;

    @NotBlank(message = "影响等级不能为空")
    private String level;               // high/medium/low

    private String description;         // 风险描述
    private String solution;            // 应对措施
    private String owner;               // 负责人
}
