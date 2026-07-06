package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 资源协同表
 */
@Data
@TableName("biz_clue_resource")
public class ClueResource {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long clueId;
    private String resourceType;
    private Long applicantId;
    private String status;      // PENDING/APPROVED/REJECTED/COMPLETED
    private LocalDateTime applyTime;
    private String effectNotes;

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
