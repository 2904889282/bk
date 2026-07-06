package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.dto.TalentPageDTO;
import com.beike.platform.entity.Talent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TalentMapper extends BaseMapper<Talent> {

    IPage<Talent> selectPageWithFilter(Page<Talent> page, @Param("dto") TalentPageDTO dto);
}
