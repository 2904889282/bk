package com.beike.platform.dto;

import lombok.Data;

/** 线索分页查询参数 */
@Data
public class CluePageDTO {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;     // 线索名称/公司模糊搜索
    private String owner;       // 承接人
    private String status;      // 线索状态
    private String level;       // 项目等级
    private String dateFrom;    // 留痕日期起
    private String dateTo;      // 留痕日期止
}
