package com.beike.auth.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.auth.entity.SysUser;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
    @Select("SELECT r.code FROM sys_role r INNER JOIN sys_user_role ur ON r.id=ur.role_id WHERE ur.user_id=#{userId}")
    List<String> findRoleCodesByUserId(String userId);

    @Select("SELECT DISTINCT p.code FROM sys_permission p INNER JOIN sys_role_permission rp ON p.id=rp.permission_id INNER JOIN sys_user_role ur ON rp.role_id=ur.role_id WHERE ur.user_id=#{userId}")
    List<String> findPermissionCodesByUserId(String userId);

    @Select("SELECT p.* FROM sys_permission p INNER JOIN sys_role_permission rp ON p.id=rp.permission_id INNER JOIN sys_user_role ur ON rp.role_id=ur.role_id WHERE ur.user_id=#{userId} AND p.type IN (0,1) ORDER BY p.sort")
    List<com.beike.auth.entity.SysPermission> findMenusByUserId(String userId);
}
