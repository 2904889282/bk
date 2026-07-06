package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 方案库 新增/编辑 DTO
 */
@Data
public class ClueSolutionSaveDTO {

    @NotBlank(message = "方案类型不能为空")
    private String solutionType;

    @NotBlank(message = "方案标题不能为空")
    private String title;

    private String description;
    private String productLevels;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private Integer isPool;     // 是否沉淀至全局资料库
}
