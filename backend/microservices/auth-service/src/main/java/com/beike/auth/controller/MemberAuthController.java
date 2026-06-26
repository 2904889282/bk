package com.beike.auth.controller;

import com.beike.auth.service.MemberIdentityService;
import com.beike.auth.security.oauth2.OAuth2ProviderConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * SSO 回调控制器 (企微/钉钉) — 不包含 /auth/login，与 AuthController 共存
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class MemberAuthController {

    private final MemberIdentityService identityService;
    private final OAuth2ProviderConfig oauth2Config;

    /** SSO 授权 URL */
    @GetMapping("/sso/urls")
    public ResponseEntity<?> ssoUrls() {
        return ResponseEntity.ok(Map.of(
                "wecom", oauth2Config.getWecom() != null ? identityService.getWecomAuthUrl() : null,
                "dingtalk", oauth2Config.getDingtalk() != null ? identityService.getDingtalkAuthUrl() : null
        ));
    }

    /** 企业微信回调 */
    @GetMapping("/sso/wecom/callback")
    public ResponseEntity<?> wecomCallback(@RequestParam String code, @RequestParam(defaultValue = "") String state) {
        try {
            var result = identityService.loginByWecom(code, state);
            return ResponseEntity.ok(Map.of(
                    "token", result.token(), "user", toUserMap(result),
                    "roles", result.roles(), "permissions", result.permissions(), "menus", result.menus()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("msg", "企业微信登录失败: " + e.getMessage()));
        }
    }

    /** 钉钉回调 */
    @GetMapping("/sso/dingtalk/callback")
    public ResponseEntity<?> dingtalkCallback(@RequestParam String code, @RequestParam(defaultValue = "") String state) {
        try {
            var result = identityService.loginByDingtalk(code, state);
            return ResponseEntity.ok(Map.of(
                    "token", result.token(), "user", toUserMap(result),
                    "roles", result.roles(), "permissions", result.permissions(), "menus", result.menus()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("msg", "钉钉登录失败: " + e.getMessage()));
        }
    }

    private Map<String, Object> toUserMap(MemberIdentityService.LoginResult r) {
        return Map.of(
                "id", r.user().getId(), "username", r.user().getUsername(),
                "name", r.user().getRealName(), "avatar", r.user().getAvatar()
        );
    }
}
