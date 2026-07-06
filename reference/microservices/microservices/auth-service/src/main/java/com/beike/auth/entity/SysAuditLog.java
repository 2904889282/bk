package com.beike.auth.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_audit_log")
public class SysAuditLog {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String userId;         // 操作人
    private String username;       // 操作人用户名
    private String operation;      // CREATE/UPDATE/DELETE/LOGIN/EXPORT
    private String targetType;     // Pipeline/Project/User/Role
    private String targetId;       // 操作对象 ID
    private String detail;         // 变更详情 JSON
    private String ipAddress;      // 来源 IP
    private String userAgent;      // 浏览器 UA
    private Integer status;        // 1 成功 0 失败
    private String errorMsg;       // 失败原因
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
