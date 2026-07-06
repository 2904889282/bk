package com.beike.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PipelineSaveDTO {
    @NotBlank(message = "商机名称不能为空")
    private String name;

    private String customer;
    private String stage;
    private BigDecimal amount;
    private Integer winRate;

    private Long ownerId;

    private String description;
    private String nextAction;

    /** 团队成员ID列表 */
    private List<Long> memberIds;
}
