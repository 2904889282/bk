package com.beike.platform.controller;

import com.beike.platform.common.Result;
import com.beike.platform.service.AuthService;
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

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto) {
        return Result.success(authService.login(dto.getUsername(), dto.getPassword()));
    }

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterDTO dto) {
        authService.register(dto.getUsername(), dto.getPassword(), dto.getRealName());
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

    @Data
    public static class LoginDTO {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Data
    public static class RegisterDTO {
        @NotBlank private String username;
        @NotBlank private String password;
        @NotBlank private String realName;
    }

    @Data
    public static class PasswordDTO {
        @NotBlank private String oldPassword;
        @NotBlank private String newPassword;
    }
}
