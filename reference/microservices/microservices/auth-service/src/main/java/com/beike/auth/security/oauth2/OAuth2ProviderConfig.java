package com.beike.auth.security.oauth2;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "beike.oauth2")
public class OAuth2ProviderConfig {

    /** 企业微信 */
    private Provider wecom;

    /** 钉钉 */
    private Provider dingtalk;

    @Data
    public static class Provider {
        private String clientId;
        private String clientSecret;
        private String authorizeUrl;
        private String tokenUrl;
        private String userInfoUrl;
        private String redirectUri;
        private String scope = "snsapi_login";
        private String corpId;
    }
}
