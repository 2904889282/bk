package com.beike.service.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beike.service.entity.mysql.Pipeline;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface PipelineMapper extends BaseMapper<Pipeline> {

    /** 按阶段统计管线数 */
    @Select("SELECT stage, COUNT(*) AS cnt FROM pipelines GROUP BY stage")
    List<Map<String, Object>> countByStage();

    /** 按产品线 + 阶段统计 */
    @Select("SELECT product, stage, COUNT(*) AS cnt FROM pipelines GROUP BY product, stage")
    List<Map<String, Object>> countByProductStage();

    /** 按行业统计金额 */
    @Select("SELECT industry, SUM(amount) AS total FROM pipelines GROUP BY industry")
    List<Map<String, Object>> sumByIndustry();

    /** 搜索 (走 MySQL 作为降级，主搜索走 ES) */
    @Select("SELECT * FROM pipelines WHERE name LIKE CONCAT('%',#{keyword},'%') OR client LIKE CONCAT('%',#{keyword},'%') OR manager LIKE CONCAT('%',#{keyword},'%')")
    List<Pipeline> searchByKeyword(String keyword);
}
