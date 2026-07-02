package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.dto.AlertPageDTO;
import com.beike.platform.entity.Alert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AlertMapper extends BaseMapper<Alert> {

    IPage<Alert> selectPageWithFilter(Page<Alert> page, @Param("dto") AlertPageDTO dto);
}
