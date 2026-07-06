package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueContact;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueContactMapper extends BaseMapper<ClueContact> {

    @Select("SELECT * FROM biz_clue_contact WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY create_time DESC")
    List<ClueContact> listByClueId(Long clueId);
}
