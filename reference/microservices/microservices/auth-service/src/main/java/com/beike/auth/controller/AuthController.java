package com.beike.auth.controller;

import com.beike.auth.common.R;
import com.beike.auth.entity.SysUser;
import com.beike.auth.security.JwtUtil;
import com.beike.auth.service.SysUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SysUserService userService;
    private final JwtUtil jwtUtil;

    /** 登录 */
    @PostMapping("/login")
    public R<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) return R.fail("用户名和密码不能为空");

        SysUser user = userService.findByUsername(username);
        if (user == null) return R.fail(401, "账号不存在");
        if (user.getStatus() != null && user.getStatus() == 0) return R.fail(401, "账号已被禁用");
        if (!userService.verifyPassword(password, user.getPassword())) return R.fail(401, "密码错误");

        List<String> roles = userService.findRoles(user.getId());
        List<String> permissions = userService.findPermissions(user.getId());
        List<Map<String, Object>> menus = userService.findMenus(user.getId()).stream()
                .filter(p -> p.getVisible() != null && p.getVisible() == 1 && p.getType() == 1)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("path", p.getPath()); m.put("name", p.getName());
                    m.put("icon", p.getIcon()); m.put("component", p.getComponent());
                    return m;
                }).toList();

        String token = jwtUtil.generate(user.getId(), user.getUsername(), roles);
        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("name", user.getRealName());
        userInfo.put("avatar", user.getAvatar());
        userInfo.put("roles", roles);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("user", userInfo);
        result.put("roles", roles);
        result.put("permissions", permissions);
        result.put("menus", menus);
        return R.ok(result);
    }

    /** 获取当前用户信息 */
    @GetMapping("/userinfo")
    public R<Map<String, Object>> userInfo(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return R.fail(401, "未登录");

        SysUser user = userService.findByUsername((String) request.getAttribute("username"));
        if (user == null) return R.fail(401, "用户不存在");

        List<String> roles = userService.findRoles(userId);
        List<String> permissions = userService.findPermissions(userId);
        List<Map<String, Object>> menus = userService.findMenus(userId).stream()
                .filter(p -> p.getVisible() != null && p.getVisible() == 1 && p.getType() == 1)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("path", p.getPath()); m.put("name", p.getName());
                    m.put("icon", p.getIcon()); m.put("component", p.getComponent());
                    return m;
                }).toList();

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("name", user.getRealName());
        userInfo.put("avatar", user.getAvatar());
        userInfo.put("roles", roles);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("user", userInfo);
        result.put("roles", roles);
        result.put("permissions", permissions);
        result.put("menus", menus);
        return R.ok(result);
    }

    /** 登出 */
    @PostMapping("/logout")
    public R<Void> logout() { return R.ok(); }

    /** 注册 — 默认角色为普通员工 */
    @PostMapping("/register")
    public R<Void> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String realName = body.get("realName");
        String phone = body.get("phone");
        String password = body.get("password");
        String confirmPwd = body.get("confirmPassword");

        if (username == null || username.trim().isEmpty()) return R.fail("用户名不能为空");
        if (realName == null || realName.trim().isEmpty()) return R.fail("姓名不能为空");
        if (password == null || password.length() < 6) return R.fail("密码至少 6 位");
        if (!password.equals(confirmPwd)) return R.fail("两次密码不一致");
        if (userService.findByUsername(username.trim()) != null) return R.fail("用户名已存在");

        try {
            userService.register(username.trim(), realName.trim(), phone, password);
            return R.ok();
        } catch (Exception e) {
            return R.fail("注册失败: " + e.getMessage());
        }
    }
}
