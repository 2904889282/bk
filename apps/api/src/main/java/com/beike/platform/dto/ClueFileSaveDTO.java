package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 资料库 文件上传 DTO
 */
@Data
public class ClueFileSaveDTO {

    @NotBlank(message = "文件类型不能为空")
    private String fileType;

    @NotBlank(message = "文件名不能为空")
    private String fileName;

    @NotBlank(message = "文件URL不能为空")
    private String fileUrl;

    private Long fileSize;
    private String fileExt;
    private String mimeType;
    private String description;
    private Integer isPool;
}
