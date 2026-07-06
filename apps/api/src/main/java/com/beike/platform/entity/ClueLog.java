package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 操作日志表 - biz_clue_log
 */
@Data
@TableName("biz_clue_log")
public class ClueLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private String actionType;          // 操作类型
    private String actionSummary;       // 变更摘要
    private String detailJson;          // 变更详情JSON
    private Long operatorId;
    private String operatorName;
    private LocalDateTime createTime;   // 操作时间（由应用层赋值）
}
