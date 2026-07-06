package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.Campaign;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface CampaignMapper extends BaseMapper<Campaign> {

    @Select("SELECT * FROM biz_campaign WHERE is_deleted = 0 AND status = 'ACTIVE' ORDER BY create_time DESC")
    List<Campaign> listActive();
}
