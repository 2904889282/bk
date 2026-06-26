package com.beike.auth.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("sys_role_permission")
public class SysRolePermission {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String roleId;
    private String permissionId;
}
