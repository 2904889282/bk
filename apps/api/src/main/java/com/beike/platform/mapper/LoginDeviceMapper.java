package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.LoginDevice;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface LoginDeviceMapper extends BaseMapper<LoginDevice> {

    @Select("SELECT * FROM sys_login_device WHERE user_id = #{userId} AND active = 1 ORDER BY login_time DESC")
    List<Map<String, Object>> selectActiveByUserId(Long userId);

    @Update("UPDATE sys_login_device SET active = 0 WHERE id = #{id} AND user_id = #{userId}")
    int kickDevice(@Param("id") Long id, @Param("userId") Long userId);

    @Update("UPDATE sys_login_device SET active = 0 WHERE user_id = #{userId}")
    int kickAllDevices(Long userId);

    @Update("UPDATE sys_login_device SET last_active = NOW() WHERE token_jti = #{jti}")
    int heartbeat(String jti);

    @Select("SELECT id FROM sys_login_device WHERE token_jti = #{jti} AND active = 1")
    Long findActiveByJti(String jti);
}
