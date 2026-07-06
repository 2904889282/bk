package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 资料库表 - biz_clue_file
 */
@Data
@TableName("biz_clue_file")
public class ClueFile {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private String fileType;        // 需求调研/方案文档/报价资料/竞品分析/会议纪要/客户提供资料/其他
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String fileExt;
    private String mimeType;
    private Integer isPool;         // 是否沉淀至全局资料库
    private String description;

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
