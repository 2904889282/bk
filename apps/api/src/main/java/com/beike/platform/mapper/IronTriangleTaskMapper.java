package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.IronTriangleTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface IronTriangleTaskMapper extends BaseMapper<IronTriangleTask> {

    @Select("SELECT * FROM biz_iron_triangle_task WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY create_time DESC")
    List<IronTriangleTask> listByClueId(Long clueId);

    @Select("SELECT * FROM biz_iron_triangle_task WHERE is_deleted = 0 AND clue_id = #{clueId} AND role = #{role} ORDER BY create_time DESC")
    List<IronTriangleTask> listByClueIdAndRole(Long clueId, String role);
}
