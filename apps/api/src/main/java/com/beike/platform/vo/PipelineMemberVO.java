package com.beike.platform.vo;

import lombok.Data;

@Data
public class PipelineMemberVO {
    private Long userId;
    private String userName;        // 用户姓名
    private String role;            // 角色
}
