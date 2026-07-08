package com.beike.service.entity.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

/**
 * LTC 线索 Excel 导入行映射
 * EasyExcel 自动映射，字段顺序即 Excel 列顺序
 */
@Data
public class PipelineExcelDTO {

    @ExcelProperty(value = "线索名称*", index = 0)
    private String name;

    @ExcelProperty(value = "客户名称*", index = 1)
    private String client;

    @ExcelProperty(value = "产品线*", index = 2)
    private String product;

    @ExcelProperty(value = "行业*", index = 3)
    private String industry;

    @ExcelProperty(value = "阶段*", index = 4)
    private String stage;

    @ExcelProperty(value = "预计金额(万)*", index = 5)
    private String amount;

    @ExcelProperty(value = "赢单率(%)", index = 6)
    private String winRate;

    @ExcelProperty(value = "优先级", index = 7)
    private String priority;

    @ExcelProperty(value = "负责人*", index = 8)
    private String manager;

    @ExcelProperty(value = "来源", index = 9)
    private String source;

    @ExcelProperty(value = "描述", index = 10)
    private String description;

    @ExcelProperty(value = "下一步行动", index = 11)
    private String nextAction;
}
