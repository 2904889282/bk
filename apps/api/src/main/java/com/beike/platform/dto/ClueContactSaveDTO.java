package com.beike.platform.dto;

import lombok.Data;

/**
 * 决策人保存请求体
 */
@Data
public class ClueContactSaveDTO {
    private String name;
    private String position;
    private String level;       // 决策层/管理层/执行层
    private String contactInfo;
    private String attitude;    // 支持/中立/反对
    private String remarks;
}
