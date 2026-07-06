package com.beike.auth.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.auth.common.R;
import com.beike.auth.entity.SysUser;
import com.beike.auth.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/system/user")
@RequiredArgsConstructor
public class UserController {

    private final SysUserService userService;

    /** 分页列表 */
    @GetMapping("/page")
    public R<Page<SysUser>> page(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return R.ok(userService.page(page, size, keyword));
    }

    /** 新增 */
    @PostMapping
    public R<SysUser> create(@RequestBody SysUser user) {
        if (user.getUsername() == null || user.getUsername().isEmpty()) return R.fail("用户名不能为空");
        if (user.getPassword() == null || user.getPassword().isEmpty()) return R.fail("密码不能为空");
        if (userService.findByUsername(user.getUsername()) != null) return R.fail("用户名已存在");
        return R.ok(userService.create(user));
    }

    /** 编辑 */
    @PutMapping
    public R<Void> update(@RequestBody SysUser user) {
        userService.update(user);
        return R.ok();
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable String id) {
        userService.delete(id);
        return R.ok();
    }

    /** 切换状态 */
    @PutMapping("/{id}/status")
    public R<Void> toggleStatus(@PathVariable String id) {
        userService.toggleStatus(id);
        return R.ok();
    }

    /** 重置密码 */
    @PutMapping("/{id}/reset-password")
    public R<Void> resetPassword(@PathVariable String id, @RequestBody Map<String, String> body) {
        String pwd = body.get("password");
        if (pwd == null || pwd.isEmpty()) return R.fail("密码不能为空");
        userService.resetPassword(id, pwd);
        return R.ok();
    }
}
