package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueFileMapper extends BaseMapper<ClueFile> {

    @Select("SELECT * FROM biz_clue_file WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY create_time DESC")
    List<ClueFile> listByClueId(Long clueId);

    @Select("SELECT * FROM biz_clue_file WHERE is_deleted = 0 AND is_pool = 1 ORDER BY create_time DESC")
    List<ClueFile> listPoolFiles();
}
