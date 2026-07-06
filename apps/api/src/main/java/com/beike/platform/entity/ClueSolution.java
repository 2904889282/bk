package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 方案库表 - biz_clue_solution
 */
@Data
@TableName("biz_clue_solution")
public class ClueSolution {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private String solutionType;    // 需求调研/方案文档/报价方案/竞品分析/演示材料/其他
    private String title;
    private String description;
    private String productLevels;   // S/A/B/C 逗号分隔
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private Integer version;
    private Integer isCurrent;      // 是否当前版本
    private Integer isPool;         // 是否沉淀至全局资料库

    @TableField(fill = FieldFill.INSERT)
    private Long createBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updateBy;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer isDeleted;
}
