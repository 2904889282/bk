package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.platform.entity.ClueOpportunityReview;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface ClueOpportunityReviewMapper extends BaseMapper<ClueOpportunityReview> {

    @Select("SELECT * FROM biz_clue_opportunity_review WHERE is_deleted = 0 AND clue_id = #{clueId} ORDER BY create_time DESC")
    List<ClueOpportunityReview> listByClueId(Long clueId);

    @Select("SELECT * FROM biz_clue_opportunity_review WHERE is_deleted = 0 AND clue_id = #{clueId} AND conclusion = '通过' ORDER BY create_time DESC LIMIT 1")
    ClueOpportunityReview findLatestApproved(Long clueId);
}
