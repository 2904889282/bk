package com.beike.service.entity.mysql;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("pipelines")
public class Pipeline {

    @TableId(type = IdType.ASSIGN_ID)
    private String id;

    private String name;
    private String stage;
    private String client;
    private String product;
    private String industry;
    private Double amount;
    private Integer winRate;
    private String priority;
    private String manager;

    /** 铁三角: AR 客户经理 */
    private String arId;
    /** 铁三角: SR 方案经理 */
    private String srId;
    /** 铁三角: FR 交付经理 */
    private String frId;

    private String source;
    private String description;
    private String nextAction;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private String createdBy;
}
