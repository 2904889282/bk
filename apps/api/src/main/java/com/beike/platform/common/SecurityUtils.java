package com.beike.platform.common;

import com.beike.platform.entity.SysUser;
import com.beike.platform.mapper.SysUserMapper;
import lombok.Getter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 安全工具类 — 提供当前登录用户的信息查询，供数据权限处理器使用。
 */
public class SecurityUtils {

    /** 当前登录用户信息（轻量 DTO） */
    @Getter
    public static class LoginUser {
        private final Long userId;
        private final String roleType;
        private final Long deptId;

        public LoginUser(Long userId, String roleType, Long deptId) {
            this.userId = userId;
            this.roleType = roleType;
            this.deptId = deptId;
        }

        /** 是否为管理员或经理 */
        public boolean isAdminOrManager() {
            return "ADMIN".equals(roleType) || "MANAGER".equals(roleType);
        }

        /** 是否为普通用户 */
        public boolean isRegularUser() {
            return "USER".equals(roleType);
        }
    }

    /**
     * 获取当前登录用户实体（完整 SysUser 对象），包含 realName、username 等。
     * 封装了 getLoginUser() + userMapper.selectById() 两步操作。
     * 若未登录或 DB 不可用则返回 null。
     */
    public static SysUser getCurrentUser() {
        LoginUser loginUser = getLoginUser();
        if (loginUser == null) return null;
        try {
            SysUserMapper userMapper = SpringContextHolder.getBean(SysUserMapper.class);
            return userMapper.selectById(loginUser.getUserId());
        } catch (Exception ignored) {
            return null;
        }
    }

    /**
     * 从当前用户获取责任人标识：优先 realName，兜底 username。
     * 仅对普通用户（ROLE_USER）有效，管理员/经理返回 null 表示不限制。
     */
    public static String getCurrentOwnerKey() {
        LoginUser loginUser = getLoginUser();
        if (loginUser == null || loginUser.isAdminOrManager()) return null;
        SysUser user = getCurrentUser();
        if (user == null) return null;
        return user.getRealName() != null ? user.getRealName() : user.getUsername();
    }

    /**
     * 获取当前登录用户，若未登录或无法获取则返回 null。
     * 优先从 DB 查询 role_type / dept_id，兜底从 Spring Security authorities 判断。
     */
    public static LoginUser getLoginUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            return null;
        }

        // 从 DB 查询完整用户信息
        try {
            SysUserMapper userMapper = SpringContextHolder.getBean(SysUserMapper.class);
            SysUser user = userMapper.selectById(userId);
            if (user != null) {
                return new LoginUser(userId, resolveRoleType(user, auth), user.getDeptId());
            }
        } catch (Exception ignored) {
            // DB 不可用时降级
        }

        // 兜底：只根据 authorities 判断角色
        String roleType = "USER";
        if (auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            roleType = "ADMIN";
        } else if (auth.getAuthorities().stream().anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()))) {
            roleType = "MANAGER";
        }
        return new LoginUser(userId, roleType, 0L);
    }

    private static String resolveRoleType(SysUser user, Authentication auth) {
        if (user.getRoleType() != null) return user.getRoleType();
        if (auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) return "ADMIN";
        if (auth.getAuthorities().stream().anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()))) return "MANAGER";
        return "USER";
    }
}
