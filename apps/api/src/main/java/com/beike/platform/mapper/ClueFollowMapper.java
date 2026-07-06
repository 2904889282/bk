package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueFollow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueFollowMapper extends BaseMapper<ClueFollow> {

    @Select("SELECT * FROM biz_clue_follow WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY follow_date DESC")
    List<ClueFollow> selectByClueId(Long clueId);
}
