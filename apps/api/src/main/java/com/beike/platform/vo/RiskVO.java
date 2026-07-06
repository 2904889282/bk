package com.beike.platform.vo;

import lombok.Data;
import java.time.LocalDateTime;

/** 风险列表/详情返回对象 */
@Data
public class RiskVO {
    private Long id;
    private Long projectId;
    private String projectName;         // 关联项目名称（联表填充）
    private String type;
    private String level;
    private String description;
    private String solution;
    private String owner;
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
