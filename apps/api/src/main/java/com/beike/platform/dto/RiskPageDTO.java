package com.beike.platform.dto;

import lombok.Data;

/** 风险分页查询参数 */
@Data
public class RiskPageDTO {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;     // 模糊匹配 风险项/描述/应对措施
    private String level;       // 影响等级筛选
    private String status;      // 状态筛选: open/resolved
}
