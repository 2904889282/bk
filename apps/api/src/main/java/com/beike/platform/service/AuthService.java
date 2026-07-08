package com.beike.platform.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beike.platform.common.BizException;
import com.beike.platform.common.JwtUtil;
import com.beike.platform.common.VerifyCodeStore;
import com.beike.platform.entity.LoginDevice;
import com.beike.platform.entity.SysDept;
import com.beike.platform.entity.SysUser;
import com.beike.platform.entity.Talent;
import com.beike.platform.mapper.LoginDeviceMapper;
import com.beike.platform.mapper.SysDeptMapper;
import com.beike.platform.mapper.SysUserMapper;
import com.beike.platform.mapper.TalentMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper userMapper;
    private final SysDeptMapper deptMapper;
    private final TalentMapper talentMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final VerifyCodeStore codeStore;
    private final LoginDeviceMapper deviceMapper;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ==================== 登录 ====================

    public Map<String, Object> login(String username, String password, HttpServletRequest request) {
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new BizException("用户名或密码错误");
        }
        if (user.getStatus() != 1) {
            throw new BizException("账号已被禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());

        // 记录登录设备
        saveLoginDevice(user.getId(), token, request);

        List<String> roles = userMapper.selectRolesByUserId(user.getId());
        List<String> permissions = userMapper.selectPermissionsByUserId(user.getId());

        return authPayload(token, refreshToken, user, roles, permissions);
    }

    // ==================== Refresh ====================

    public Map<String, String> refresh(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new BizException("Refresh Token 已过期，请重新登录");
        }
        Long userId = jwtUtil.getUserId(refreshToken);
        String username = jwtUtil.getUsername(refreshToken);

        SysUser user = userMapper.selectById(userId);
        if (user == null || user.getStatus() != 1) {
            throw new BizException("用户不存在或已被禁用");
        }

        String newAccessToken = jwtUtil.generateToken(userId, username);
        String newRefreshToken = jwtUtil.generateRefreshToken(userId, username);

        return Map.of(
                "token", newAccessToken,
                "refreshToken", newRefreshToken
        );
    }

    // ==================== 注册 ====================

    @Transactional(rollbackFor = Exception.class)
    public void register(String username, String password, String realName, String email, Long deptId, String deptName) {
        if (userMapper.exists(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username))) {
            throw new BizException("用户名已存在");
        }
        // 自定义部门：优先按名称处理（已存在则复用，不存在则新建），再回填 deptId
        if (deptName != null && !deptName.trim().isEmpty()) {
            String name = deptName.trim();
            SysDept dept = deptMapper.selectOne(
                    new LambdaQueryWrapper<SysDept>().eq(SysDept::getName, name));
            if (dept == null) {
                dept = new SysDept();
                dept.setName(name);
                deptMapper.insert(dept);
            }
            deptId = dept.getId();
        }
        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setEmail(email);
        user.setStatus(1);
        if (deptId != null) user.setDeptId(deptId);
        userMapper.insert(user);
        userMapper.insertUserRole(user.getId(), 3L);

        // 自动加入人才池（外部人员），部门信息写入角色字段
        String resolvedDeptName = resolveDeptName(deptId);
        Talent talent = new Talent();
        talent.setName(realName != null ? realName : username);
        talent.setRole(resolvedDeptName != null ? resolvedDeptName + "-外部人员" : "外部人员");
        talent.setTalentType("external");
        talent.setStatus("normal");
        talent.setUtilization(0);
        talentMapper.insert(talent);
    }

    private String resolveDeptName(Long deptId) {
        if (deptId == null) return null;
        SysDept dept = deptMapper.selectById(deptId);
        return dept != null ? dept.getName() : null;
    }

    // ==================== 邮箱验证码登录 ====================

    public Map<String, Object> loginByEmail(String email, String code, HttpServletRequest request) {
        if (!codeStore.verify(email, code)) {
            throw new BizException("验证码错误或已过期");
        }
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getEmail, email));
        if (user == null) throw new BizException("该邮箱未注册");
        if (user.getStatus() != 1) throw new BizException("账号已被禁用");

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getUsername());
        saveLoginDevice(user.getId(), token, request);

        List<String> roles = userMapper.selectRolesByUserId(user.getId());
        List<String> permissions = userMapper.selectPermissionsByUserId(user.getId());

        return authPayload(token, refreshToken, user, roles, permissions);
    }

    // ==================== 用户信息 ====================

    public Map<String, Object> getUserInfo() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        SysUser user = userMapper.selectById(userId);
        if (user == null) throw BizException.notFound("用户");

        List<String> roles = userMapper.selectRolesByUserId(userId);
        List<String> permissions = userMapper.selectPermissionsByUserId(userId);

        return Map.of(
                "user", userPayload(user, roles, permissions),
                "roles", roles,
                "permissions", permissions
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void changePassword(String oldPassword, String newPassword) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        SysUser user = userMapper.selectById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BizException("原密码不正确");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }

    // ==================== 忘记密码 ====================

    public String sendVerifyCode(String email) {
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getEmail, email));
        if (user == null) {
            throw new BizException("该邮箱未绑定账号");
        }
        String code = String.format("%06d", RANDOM.nextInt(1000000));
        codeStore.put(email, code);
        // 生产环境：调用邮件服务发送验证码
        // mailService.send(email, "验证码", "您的验证码是：" + code);
        return code;
    }

    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(String email, String code, String newPassword) {
        if (!codeStore.verify(email, code)) {
            throw new BizException("验证码错误或已过期");
        }
        SysUser user = userMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getEmail, email));
        if (user == null) {
            throw new BizException("用户不存在");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);

        // 重置密码后踢掉所有设备，强制重新登录
        deviceMapper.kickAllDevices(user.getId());
    }

    // ==================== 多设备管理 ====================

    public List<Map<String, Object>> getMyDevices() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String currentJti = getCurrentJti();
        return deviceMapper.selectActiveByUserId(userId).stream()
                .map(row -> {
                    row.put("isCurrent", currentJti != null && currentJti.equals(row.get("token_jti")));
                    return row;
                })
                .collect(Collectors.toList());
    }

    public void kickDevice(Long deviceId) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // 不能踢当前设备
        LoginDevice device = deviceMapper.selectById(deviceId);
        if (device == null || !device.getUserId().equals(userId)) {
            throw new BizException("设备不存在");
        }
        String currentJti = getCurrentJti();
        if (currentJti != null && currentJti.equals(device.getTokenJti())) {
            throw new BizException("不能踢自己下线，请使用退出登录功能");
        }
        deviceMapper.kickDevice(deviceId, userId);
    }

    public void kickAllDevices() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // 保留当前设备，踢其他所有
        String currentJti = getCurrentJti();
        if (currentJti != null) {
            // 先把所有设为 0，再把当前还原为 1
            deviceMapper.kickAllDevices(userId);
            // 恢复当前设备
            LoginDevice current = deviceMapper.selectOne(
                    new LambdaQueryWrapper<LoginDevice>()
                            .eq(LoginDevice::getUserId, userId)
                            .eq(LoginDevice::getTokenJti, currentJti));
            if (current != null) {
                current.setActive(1);
                deviceMapper.updateById(current);
            }
        } else {
            deviceMapper.kickAllDevices(userId);
        }
    }

    // ==================== 内部方法 ====================

    private void saveLoginDevice(Long userId, String token, HttpServletRequest request) {
        LoginDevice device = new LoginDevice();
        device.setUserId(userId);
        device.setTokenJti(jwtUtil.getJti(token));
        device.setIp(getClientIp(request));
        device.setUserAgent(request.getHeader("User-Agent"));
        device.setLoginTime(LocalDateTime.now());
        device.setLastActive(LocalDateTime.now());
        device.setActive(1);
        deviceMapper.insert(device);
    }

    private Map<String, Object> authPayload(String token, String refreshToken, SysUser user,
                                            List<String> roles, List<String> permissions) {
        return Map.of(
                "token", token,
                "refreshToken", refreshToken,
                "user", userPayload(user, roles, permissions),
                "roles", roles,
                "permissions", permissions
        );
    }

    private Map<String, Object> userPayload(SysUser user, List<String> roles, List<String> permissions) {
        return Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "name", user.getRealName(),
                "realName", user.getRealName(),
                "roles", roles,
                "permissions", permissions
        );
    }

    private String getCurrentJti() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getCredentials() instanceof String token) {
                return jwtUtil.getJti(token);
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null && ip.contains(",") ? ip.split(",")[0].trim() : ip;
    }
}
