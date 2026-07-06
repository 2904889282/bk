package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.dto.RiskPageDTO;
import com.beike.platform.entity.Risk;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RiskMapper extends BaseMapper<Risk> {

    IPage<Risk> selectPageWithFilter(Page<Risk> page, @Param("dto") RiskPageDTO dto);
}
