package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.entity.Clue;
import com.beike.platform.dto.CluePageDTO;
import org.apache.ibatis.annotations.*;

@Mapper
public interface ClueMapper extends BaseMapper<Clue> {

    IPage<Clue> selectPageWithFilter(Page<Clue> page, @Param("dto") CluePageDTO dto);

    //==== 回收站 ====
    @Select("SELECT * FROM biz_clue WHERE is_deleted = 1 ORDER BY update_time DESC")
    IPage<Clue> selectDeletedPage(Page<Clue> page);

    @Update("UPDATE biz_clue SET is_deleted = 0, update_time = NOW() WHERE id = #{id}")
    void restoreById(Long id);

    @Delete("DELETE FROM biz_clue WHERE id = #{id}")
    void permDeleteById(Long id);

    @Select("SELECT * FROM biz_clue WHERE id = #{id}")
    Clue selectByIdIgnoreDeleted(Long id);

    //==== 统计 ====
    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0")
    Long countTotal();

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND clue_status IN ('接触', '线索接触')")
    Long countPending();

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND clue_status IN ('承接', '已承接')")
    Long countAccepted();

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND is_converted = 1")
    Long countConverted();

    //==== Campaign Dashboard ====
    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND campaign_id = #{campaignId}")
    int countByCampaign(Long campaignId);

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND campaign_id = #{campaignId} AND clue_status IN ('承接', '已承接', '沟通', '提案', '跟进中', '已提案')")
    int countValidByCampaign(Long campaignId);

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND campaign_id = #{campaignId} AND is_converted = 1")
    int countConvertedByCampaign(Long campaignId);

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND campaign_id = #{campaignId} AND health_status = 'yellow'")
    int countYellowByCampaign(Long campaignId);

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND campaign_id = #{campaignId} AND health_status = 'red'")
    int countRedByCampaign(Long campaignId);

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND campaign_id = #{campaignId} AND clue_status IN ('接触', '线索接触', '待跟进')")
    int countPendingByCampaign(Long campaignId);

    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND health_status = 'red'")
    int countRedHealth();

    //==== Health Scan ====
    @Update("UPDATE biz_clue SET health_status = #{status}, update_time = NOW() WHERE id = #{id}")
    void updateHealthStatus(@Param("id") Long id, @Param("status") String status);

    //==== Clue Number ====
    @Select("SELECT COUNT(*) FROM biz_clue WHERE is_deleted = 0 AND clue_number LIKE CONCAT('XS-', #{prefix}, '-%')")
    int countByMonthPrefix(@Param("prefix") String prefix);

    //==== Full Detail Queries ====
    @Select("SELECT c.* FROM biz_campaign c WHERE c.id = #{campaignId} AND c.is_deleted = 0")
    Object getCampaignByClue(Long campaignId);
}
