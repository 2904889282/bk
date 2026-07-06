package com.beike.platform.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PipelineVO {
    private Long id;
    private String name;
    private String customer;
    private String stage;
    private BigDecimal amount;
    private Integer winRate;
    private Long ownerId;
    private String ownerName;       // 负责人姓名(关联查询)
    private Long deptId;
    private String deptName;        // 部门名称(关联查询)
    private Integer isSea;
    private String description;
    private String nextAction;
    private List<PipelineMemberVO> members; // 团队成员
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
