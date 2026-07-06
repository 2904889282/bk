package com.beike.platform.controller;

import com.beike.platform.common.Result;
import com.beike.platform.mapper.SysUserMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/role")
@RequiredArgsConstructor
public class RoleController {

    private final SysUserMapper userMapper;

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('system:role')")
    public Result<List<Map<String, Object>>> list() {
        return Result.success(userMapper.selectAllRoles());
    }

    @Data
    public static class RolePermDTO {
        @NotNull private Long roleId;
        @NotNull private List<Long> permissionIds;
    }

    @PutMapping("/permission")
    @PreAuthorize("hasAuthority('system:role')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> assignPermissions(@Valid @RequestBody RolePermDTO dto) {
        userMapper.deleteRolePermissions(dto.getRoleId());
        if (!dto.getPermissionIds().isEmpty()) {
            userMapper.insertRolePermissions(dto.getRoleId(), dto.getPermissionIds());
        }
        return Result.success();
    }

    @GetMapping("/{roleId}/permission")
    @PreAuthorize("hasAuthority('system:role')")
    public Result<List<Long>> getPermissionIds(@PathVariable Long roleId) {
        return Result.success(userMapper.selectPermissionIdsByRole(roleId));
    }

    @GetMapping("/permission/all")
    @PreAuthorize("hasAuthority('system:role')")
    public Result<List<Map<String, Object>>> allPermissions() {
        return Result.success(userMapper.selectAllPermissions());
    }
}
