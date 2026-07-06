package com.beike.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.auth.entity.*;
import com.beike.auth.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SysUserService {

    private final SysUserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** 分页查询 */
    public Page<SysUser> page(int page, int size, String keyword) {
        var qw = new LambdaQueryWrapper<SysUser>();
        if (keyword != null && !keyword.isEmpty()) {
            qw.like(SysUser::getUsername, keyword).or().like(SysUser::getRealName, keyword);
        }
        qw.orderByDesc(SysUser::getCreatedAt);
        return userMapper.selectPage(new Page<>(page, size), qw);
    }

    /** 根据用户名查找 */
    public SysUser findByUsername(String username) {
        return userMapper.selectOne(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
    }

    /** 新增用户 */
    @Transactional
    public SysUser create(SysUser user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userMapper.insert(user);
        return user;
    }

    /** 更新用户（密码为空不修改） */
    @Transactional
    public void update(SysUser user) {
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            user.setPassword(null); // MyBatis-Plus 忽略 null 字段
        }
        userMapper.updateById(user);
    }

    /** 注册 — 默认 ROLE_USER */
    @Transactional
    public SysUser register(String username, String realName, String phone, String password) {
        SysUser user = new SysUser();
        user.setUsername(username);
        user.setRealName(realName);
        user.setPassword(passwordEncoder.encode(password));
        user.setStatus(1);
        userMapper.insert(user);
        return user;
    }
    public void delete(String id) { userMapper.deleteById(id); }

    /** 切换状态 */
    public void toggleStatus(String id) {
        var user = userMapper.selectById(id);
        if (user != null) {
            user.setStatus(user.getStatus() == 1 ? 0 : 1);
            userMapper.updateById(user);
        }
    }

    /** 重置密码 */
    public void resetPassword(String id, String newPwd) {
        var user = new SysUser();
        user.setId(id);
        user.setPassword(passwordEncoder.encode(newPwd));
        userMapper.updateById(user);
    }

    /** 验证密码 */
    public boolean verifyPassword(String raw, String encoded) {
        return passwordEncoder.matches(raw, encoded);
    }

    /** 获取角色列表 */
    public List<String> findRoles(String userId) {
        return userMapper.findRoleCodesByUserId(userId);
    }

    /** 获取权限码列表 */
    public List<String> findPermissions(String userId) {
        return userMapper.findPermissionCodesByUserId(userId);
    }

    /** 获取菜单 */
    public List<SysPermission> findMenus(String userId) {
        return userMapper.findMenusByUserId(userId);
    }
}
