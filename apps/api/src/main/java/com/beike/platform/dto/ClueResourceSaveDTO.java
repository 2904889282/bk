package com.beike.platform.dto;

import lombok.Data;

/**
 * 资源申请请求体
 */
@Data
public class ClueResourceSaveDTO {
    private String resourceType;
    private String effectNotes;
}
