package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.PipelineMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PipelineMemberMapper extends BaseMapper<PipelineMember> {

    @Select("SELECT user_id FROM biz_pipeline_member WHERE pipeline_id = #{pipelineId}")
    List<Long> selectUserIdsByPipelineId(Long pipelineId);

    @Select("SELECT * FROM biz_pipeline_member WHERE pipeline_id = #{pipelineId}")
    List<PipelineMember> selectByPipelineId(Long pipelineId);
}
