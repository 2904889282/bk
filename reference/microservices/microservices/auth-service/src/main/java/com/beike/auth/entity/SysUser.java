package com.beike.auth.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("users")
public class SysUser {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;

    private String username;
    private String password;
    private String realName;
    private String avatar;
    private String email;
    private String phone;
    private Integer status;     // 0 禁用 1 正常

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
