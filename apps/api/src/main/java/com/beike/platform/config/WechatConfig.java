package com.beike.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "beike.wechat")
public class WechatConfig {
    /** 微信开放平台 AppID */
    private String appId = "";
    /** 微信开放平台 AppSecret */
    private String appSecret = "";
    /** 授权回调地址 */
    private String redirectUri = "http://localhost:5173/login";
}
