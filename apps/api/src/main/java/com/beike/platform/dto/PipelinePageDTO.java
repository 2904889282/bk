package com.beike.platform.dto;

import lombok.Data;

@Data
public class PipelinePageDTO {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;         // 商机名称/客户搜索
    private String stage;           // 阶段筛选
    private String owner;           // 负责人
    private String customer;        // 客户名称
    private String dateFrom;        // 创建时间起
    private String dateTo;          // 创建时间止
    private Integer isSea;          // 公海筛选: 1=公海, 0=私海, null=全部
}
