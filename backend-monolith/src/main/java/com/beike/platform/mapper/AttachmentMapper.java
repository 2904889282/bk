package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.Attachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface AttachmentMapper extends BaseMapper<Attachment> {

    @Select("SELECT * FROM biz_attachment WHERE biz_type = #{bizType} AND biz_id = #{bizId} ORDER BY upload_time DESC")
    List<Attachment> selectByBiz(String bizType, Long bizId);
}
