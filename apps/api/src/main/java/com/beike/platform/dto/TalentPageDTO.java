package com.beike.platform.dto;

import lombok.Data;

/** 人才分页查询参数 */
@Data
public class TalentPageDTO {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;     // 模糊匹配 姓名/角色/技能
    private String status;      // 状态筛选
}
