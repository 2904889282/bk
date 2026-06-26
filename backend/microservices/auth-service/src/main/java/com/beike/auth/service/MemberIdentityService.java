package com.beike.auth.service;

import com.beike.auth.entity.SysUser;
import com.beike.auth.mapper.SysUserMapper;
import com.beike.auth.security.JwtUtil;
import com.beike.auth.security.oauth2.OAuth2ProviderConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 成员统一身份服务
 * 支持: 账号密码 / 企业微信 OAuth2 / 钉钉 OAuth2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberIdentityService {

    private final SysUserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final OAuth2ProviderConfig oauth2Config;
    private final RestTemplate restTemplate = new RestTemplate();

    // ============================
    // 账号密码登录
    // ============================
    public LoginResult loginByPassword(String username, String password) {
        var user = userMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUsername, username).eq(SysUser::getStatus, 1)
        ).stream().findFirst().orElse(null);
        if (user == null || !password.equals(user.getPassword())) {
            throw new AuthException("用户名或密码错误");
        }
        return buildResult(user);
    }

    // ============================
    // 企业微信 SSO
    // ============================
    public String getWecomAuthUrl() {
        var cfg = oauth2Config.getWecom();
        return String.format("%s?appid=%s&redirect_uri=%s&response_type=code&scope=snsapi_login&state=%s#wechat_redirect",
                cfg.getAuthorizeUrl(), cfg.getCorpId(), cfg.getRedirectUri(), UUID.randomUUID().toString().substring(0, 8));
    }

    public LoginResult loginByWecom(String code, String state) {
        var cfg = oauth2Config.getWecom();
        // 1. code → access_token
        String tokenUrl = String.format("%s?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
                cfg.getTokenUrl(), cfg.getCorpId(), cfg.getClientSecret(), code);
        JsonNode tokenResp = callGet(tokenUrl);
        String userId = tokenResp.get("UserId").asText();
        String deviceId = tokenResp.path("DeviceId").asText("");

        // 2. 获取用户详情
        String userUrl = String.format("%s?access_token=%s&userid=%s",
                cfg.getUserInfoUrl(), tokenResp.get("access_token").asText(), userId);
        JsonNode userResp = callGet(userUrl);
        String name = userResp.path("name").asText(userId);
        String avatar = userResp.path("avatar").asText("");

        // 3. 查找或创建本地用户
        return findOrCreateOAuth2User("wecom_" + userId, name, avatar, "ROLE_USER");
    }

    // ============================
    // 钉钉 SSO
    // ============================
    public String getDingtalkAuthUrl() {
        var cfg = oauth2Config.getDingtalk();
        return String.format("%s?client_id=%s&redirect_uri=%s&response_type=code&scope=openid&state=%s&prompt=consent",
                cfg.getAuthorizeUrl(), cfg.getClientId(), cfg.getRedirectUri(), UUID.randomUUID().toString().substring(0, 8));
    }

    public LoginResult loginByDingtalk(String code, String state) {
        var cfg = oauth2Config.getDingtalk();
        // 1. code → accessToken
        var body = new LinkedMultiValueMap<String, String>();
        body.add("clientId", cfg.getClientId());
        body.add("clientSecret", cfg.getClientSecret());
        body.add("code", code);
        body.add("grantType", "authorization_code");
        JsonNode tokenResp = restTemplate.postForObject(cfg.getTokenUrl(), body, JsonNode.class);

        // 2. accessToken → userInfo
        String accessToken = tokenResp.path("accessToken").asText();
        String userUrl = cfg.getUserInfoUrl() + "?access_token=" + accessToken;
        JsonNode userResp = callGet(userUrl);
        String openId = userResp.path("openId").asText();
        String name = userResp.path("nick").asText(openId);
        String avatar = userResp.path("avatarUrl").asText("");

        // 3. 查找或创建
        return findOrCreateOAuth2User("dingtalk_" + openId, name, avatar, "ROLE_USER");
    }

    // ============================
    // 内部
    // ============================
    private LoginResult findOrCreateOAuth2User(String username, String name, String avatar, String defaultRole) {
        var user = userMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUsername, username)
        ).stream().findFirst().orElse(null);

        if (user == null) {
            user = new SysUser();
            user.setId(UUID.randomUUID().toString().substring(0, 12));
            user.setUsername(username);
            user.setPassword(UUID.randomUUID().toString());   // OAuth2 用户无密码
            user.setRealName(name);
            user.setAvatar(avatar);
            user.setStatus(1);
            userMapper.insert(user);
            // TODO: 绑定默认角色
        }
        return buildResult(user);
    }

    private LoginResult buildResult(SysUser user) {
        List<String> roles = userMapper.findRoleCodesByUserId(user.getId());
        List<String> perms = userMapper.findPermissionCodesByUserId(user.getId());
        List<Map<String, Object>> menus = convertMenus(userMapper.findMenusByUserId(user.getId()));
        String token = jwtUtil.generate(user.getId(), user.getUsername(), roles);
        return new LoginResult(token, user, roles, perms, menus);
    }

    private JsonNode callGet(String url) {
        try {
            return restTemplate.getForObject(url, JsonNode.class);
        } catch (Exception e) {
            log.error("OAuth2 API 调用失败: {}", url, e);
            throw new AuthException("第三方认证失败");
        }
    }

    private List<Map<String, Object>> convertMenus(List<com.beike.auth.entity.SysPermission> list) {
        return list.stream().map(p -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("path", p.getPath()); m.put("name", p.getName());
            m.put("icon", p.getIcon()); m.put("component", p.getComponent());
            return m;
        }).toList();
    }

    // ============================
    // LoginResult DTO
    // ============================
    public record LoginResult(String token, SysUser user, List<String> roles,
                               List<String> permissions, List<Map<String, Object>> menus) {}

    public static class AuthException extends RuntimeException {
        public AuthException(String msg) { super(msg); }
    }
}
