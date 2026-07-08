package com.beike.service.repository;

import com.beike.service.entity.es.PipelineDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Elasticsearch 线索搜索 Repository
 * Spring Data Elasticsearch 自动实现 CRUD + 自定义查询
 */
@Repository
public interface PipelineSearchRepository extends ElasticsearchRepository<PipelineDocument, String> {

    /** IK 分词搜索 - 匹配名称、客户、描述 */
    List<PipelineDocument> findByNameOrClientOrDescriptionContaining(String name, String client, String description);

    /** 按阶段筛选 */
    List<PipelineDocument> findByStage(String stage);

    /** 按产品线筛选 */
    List<PipelineDocument> findByProduct(String product);

    /** 按行业筛选 */
    List<PipelineDocument> findByIndustry(String industry);

    /** 金额范围搜索 */
    List<PipelineDocument> findByAmountBetween(Double min, Double max);
}
