package com.beike.platform.controller;

import com.beike.platform.common.Result;
import com.beike.platform.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ==================== 登录注册 ====================

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto, HttpServletRequest request) {
        return Result.success(authService.login(dto.getUsername(), dto.getPassword(), request));
    }

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterDTO dto) {
        authService.register(dto.getUsername(), dto.getPassword(), dto.getRealName(), dto.getEmail(), dto.getDeptId());
        return Result.success();
    }

    @GetMapping("/userinfo")
    public Result<Map<String, Object>> userInfo() {
        return Result.success(authService.getUserInfo());
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody PasswordDTO dto) {
        authService.changePassword(dto.getOldPassword(), dto.getNewPassword());
        return Result.success();
    }

    /** Refresh Token 刷新 Access Token（无感刷新） */
    @PostMapping("/refresh")
    public Result<Map<String, String>> refresh(@Valid @RequestBody RefreshDTO dto) {
        return Result.success(authService.refresh(dto.getRefreshToken()));
    }

    // ==================== 忘记密码 ====================

    /** 邮箱验证码登录 */
    @PostMapping("/login-by-email")
    public Result<Map<String, Object>> loginByEmail(@Valid @RequestBody EmailLoginDTO dto, HttpServletRequest request) {
        return Result.success(authService.loginByEmail(dto.getEmail(), dto.getCode(), request));
    }

    /** 发送邮箱验证码（开发环境直接返回验证码，生产环境需对接邮件服务） */
    @PostMapping("/send-code")
    public Result<Map<String, String>> sendCode(@Valid @RequestBody SendCodeDTO dto) {
        String code = authService.sendVerifyCode(dto.getEmail());
        // 开发环境：返回验证码便于测试；生产环境去掉此行
        return Result.success(Map.of("message", "验证码已发送", "code", code));
    }

    /** 通过邮箱验证码重置密码 */
    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        authService.resetPassword(dto.getEmail(), dto.getCode(), dto.getNewPassword());
        return Result.success();
    }

    // ==================== 多设备管理 ====================

    /** 我的设备列表 */
    @GetMapping("/devices")
    public Result<java.util.List<Map<String, Object>>> devices() {
        return Result.success(authService.getMyDevices());
    }

    /** 踢下线指定设备 */
    @DeleteMapping("/devices/{id}")
    public Result<Void> kickDevice(@PathVariable Long id) {
        authService.kickDevice(id);
        return Result.success();
    }

    /** 踢下线所有设备（除当前） */
    @DeleteMapping("/devices")
    public Result<Void> kickAllDevices() {
        authService.kickAllDevices();
        return Result.success();
    }

    // ==================== DTO ====================

    @Data
    public static class LoginDTO {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data
    public static class RegisterDTO {
        @NotBlank private String username;
        @NotBlank private String password;
        @NotBlank(message = "真实姓名不能为空") private String realName;
        @NotBlank private String email;
        private Long deptId;             // 所属部门ID
    }

    @Data
    public static class PasswordDTO {
        @NotBlank private String oldPassword;
        @NotBlank private String newPassword;
    }

    @Data
    public static class RefreshDTO {
        @NotBlank private String refreshToken;
    }

    @Data
    public static class SendCodeDTO {
        @NotBlank private String email;
    }

    @Data
    public static class ResetPasswordDTO {
        @NotBlank private String email;
        @NotBlank private String code;
        @NotBlank private String newPassword;
    }

    @Data
    public static class EmailLoginDTO {
        @NotBlank private String email;
        @NotBlank private String code;
    }
}
