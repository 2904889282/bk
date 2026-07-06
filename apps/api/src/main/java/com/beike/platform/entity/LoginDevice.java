package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_login_device")
public class LoginDevice {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String tokenJti;
    private String deviceName;
    private String ip;
    private String userAgent;
    private LocalDateTime loginTime;
    private LocalDateTime lastActive;
    private Integer active;
}
