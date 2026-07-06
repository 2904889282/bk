package com.beike.auth.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("sys_user_role")
public class SysUserRole {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String userId;
    private String roleId;
}
