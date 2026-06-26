package com.beike.auth.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/** 权限/菜单 — RBAC 核心 */
@Data
@TableName("sys_permission")
public class SysPermission {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;

    private String parentId;      // 父级 ID (树结构)
    private String name;          // 菜单/按钮名称
    private String code;          // 权限标识: pipeline:create, admin:user
    private Integer type;         // 0 目录 1 菜单 2 按钮
    private String path;          // 前端路由 /ltc/kanban
    private String component;     // 前端组件路径
    private String icon;          // Ant Design icon 名
    private Integer sort;
    private Integer visible;      // 0 隐藏 1 显示

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
