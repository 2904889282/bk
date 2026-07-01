package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.entity.SysUser;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT r.code FROM sys_role r INNER JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = #{userId} AND r.is_deleted = 0")
    List<String> selectRolesByUserId(Long userId);

    @Select("SELECT DISTINCT p.code FROM sys_permission p " +
            "INNER JOIN sys_role_permission rp ON p.id = rp.permission_id " +
            "INNER JOIN sys_user_role ur ON rp.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND p.is_deleted = 0")
    List<String> selectPermissionsByUserId(Long userId);

    @Insert("INSERT INTO sys_user_role (user_id, role_id) VALUES (#{userId}, #{roleId})")
    void insertUserRole(Long userId, Long roleId);

    //==== 角色权限管理 ====
    @Select("SELECT id, name, code FROM sys_role WHERE is_deleted = 0")
    @MapKey("id")
    List<Map<String, Object>> selectAllRoles();

    @Select("SELECT * FROM sys_permission WHERE is_deleted = 0 ORDER BY id")
    @MapKey("id")
    List<Map<String, Object>> selectAllPermissions();

    @Delete("DELETE FROM sys_role_permission WHERE role_id = #{roleId}")
    void deleteRolePermissions(Long roleId);

    @Insert("<script>INSERT INTO sys_role_permission (role_id, permission_id) VALUES " +
            "<foreach collection='permIds' item='pid' separator=','>(#{roleId}, #{pid})</foreach></script>")
    void insertRolePermissions(@Param("roleId") Long roleId, @Param("permIds") List<Long> permIds);

    @Select("SELECT permission_id FROM sys_role_permission WHERE role_id = #{roleId}")
    List<Long> selectPermissionIdsByRole(Long roleId);

    //==== 操作日志 ====
    @Select("<script>SELECT id, user_name AS userName, action,module,target_id AS targetId,detail, " +
            "DATE_FORMAT(create_time,'%Y-%m-%d %H:%i:%s') AS createTime, ip " +
            "FROM sys_operation_log WHERE 1=1 " +
            "<if test='userName!=null and userName!=\"\"'> AND user_name LIKE CONCAT('%',#{userName},'%')</if> " +
            "<if test='action!=null and action!=\"\"'> AND action = #{action}</if> " +
            "<if test='dateFrom!=null and dateFrom!=\"\"'> AND create_time &gt;= #{dateFrom}</if> " +
            "<if test='dateTo!=null and dateTo!=\"\"'> AND create_time &lt;= DATE_ADD(#{dateTo}, INTERVAL 1 DAY)</if> " +
            "ORDER BY create_time DESC</script>")
    IPage<Map<String, Object>> selectLogPage(Page<?> page, String userName, String action, String dateFrom, String dateTo);
}
