package com.beike.platform.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * 铁三角任务保存请求体
 */
@Data
public class IronTriangleTaskSaveDTO {
    private String role;        // AR/SR/FR
    private Long assigneeId;
    private String taskTitle;
    private LocalDate deadline;
    private String deliverable;
}
