package com.beike.platform.dto;

import lombok.Data;

/** 预警分页查询参数 */
@Data
public class AlertPageDTO {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;     // 模糊匹配 预警类型/描述
    private String level;       // 严重程度筛选
    private String status;      // 状态筛选: open/resolved
}
