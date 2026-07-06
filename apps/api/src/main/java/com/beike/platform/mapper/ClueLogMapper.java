package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueLogMapper extends BaseMapper<ClueLog> {

    @Select("SELECT * FROM biz_clue_log WHERE clue_id = #{clueId} ORDER BY create_time DESC")
    List<ClueLog> listByClueId(Long clueId);

    @Select("SELECT * FROM biz_clue_log WHERE clue_id = #{clueId} AND action_type = #{actionType} ORDER BY create_time DESC")
    List<ClueLog> listByClueIdAndType(Long clueId, String actionType);
}
