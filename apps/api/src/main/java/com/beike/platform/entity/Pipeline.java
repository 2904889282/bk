package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_pipeline")
public class Pipeline {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;            // 商机名称
    private String customer;        // 客户名称
    private String stage;           // 阶段: lead/verify/opportunity/contract/delivery/cash/closed_lost
    private BigDecimal amount;      // 预计金额
    private Integer winRate;        // 赢率 0-100
    private Long ownerId;           // 负责人ID
    private Long deptId;            // 负责人所属部门ID(冗余)
    private Integer isSea;          // 是否公海: 1=公海, 0=私海
    private String description;     // 描述
    private String nextAction;      // 下一步行动

    // ========== 审计字段 ==========
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
