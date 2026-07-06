package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueResourceMapper extends BaseMapper<ClueResource> {

    @Select("SELECT * FROM biz_clue_resource WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY create_time DESC")
    List<ClueResource> listByClueId(Long clueId);
}
