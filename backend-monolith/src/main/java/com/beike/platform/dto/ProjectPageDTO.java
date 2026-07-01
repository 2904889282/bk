package com.beike.platform.dto;

import lombok.Data;

@Data
public class ProjectPageDTO {
    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;
    private String status;
    private String manager;
}
