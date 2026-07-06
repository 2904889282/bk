package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.Result;
import com.beike.platform.entity.SysUser;
import com.beike.platform.mapper.SysUserMapper;
import com.beike.platform.common.BizException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final SysUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Data
    public static class UserPageDTO { private Integer pageNum=1; private Integer pageSize=10; private String keyword; }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:user')")
    public Result<IPage<SysUser>> page(UserPageDTO dto) {
        Page<SysUser> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        return Result.success(userMapper.selectPage(page, null));
    }

    @Data
    public static class UserSaveDTO {
        @NotBlank private String username;
        @NotBlank private String realName;
        private String password;
        private String email;
        private String phone;
        private Long roleId; // 单角色分配
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system:user')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> create(@Valid @RequestBody UserSaveDTO dto) {
        if (userMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, dto.getUsername())) > 0) {
            throw new BizException("用户名已存在");
        }
        SysUser user = new SysUser();
        user.setUsername(dto.getUsername());
        user.setRealName(dto.getRealName());
        user.setPassword(passwordEncoder.encode(dto.getPassword() != null ? dto.getPassword() : "123456"));
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setStatus(1);
        userMapper.insert(user);
        if (dto.getRoleId() != null) userMapper.insertUserRole(user.getId(), dto.getRoleId());
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('system:user')")
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> update(@PathVariable Long id, @RequestBody UserSaveDTO dto) {
        SysUser user = userMapper.selectById(id);
        if (user == null) throw BizException.notFound("用户");
        if (dto.getRealName() != null) user.setRealName(dto.getRealName());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        userMapper.updateById(user);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('system:user')")
    public Result<Void> toggleStatus(@PathVariable Long id) {
        SysUser user = userMapper.selectById(id);
        if (user == null) throw BizException.notFound("用户");
        user.setStatus(user.getStatus() == 1 ? 0 : 1);
        userMapper.updateById(user);
        return Result.success();
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('system:user')")
    public Result<Void> resetPassword(@PathVariable Long id) {
        SysUser user = userMapper.selectById(id);
        if (user == null) throw BizException.notFound("用户");
        user.setPassword(passwordEncoder.encode("123456"));
        userMapper.updateById(user);
        return Result.success();
    }
}
