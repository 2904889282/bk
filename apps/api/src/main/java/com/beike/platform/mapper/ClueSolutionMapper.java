package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueSolution;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueSolutionMapper extends BaseMapper<ClueSolution> {

    @Select("SELECT * FROM biz_clue_solution WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY create_time DESC")
    List<ClueSolution> listByClueId(Long clueId);

    @Select("SELECT * FROM biz_clue_solution WHERE is_deleted = 0 AND clue_id = #{clueId} AND is_current = 1 ORDER BY create_time DESC")
    List<ClueSolution> listCurrentByClueId(Long clueId);
}
