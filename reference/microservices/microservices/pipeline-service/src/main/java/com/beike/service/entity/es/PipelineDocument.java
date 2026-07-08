package com.beike.service.entity.es;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

/**
 * Elasticsearch 线索文档 (用于搜索)
 * 索引名: beike_pipelines
 * IK 分词: ik_max_word (索引) / ik_smart (搜索)
 */
@Data
@Document(indexName = "beike_pipelines")
@Setting(settingPath = "es/pipeline-settings.json")
public class PipelineDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String name;

    @Field(type = FieldType.Keyword)
    private String stage;

    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String client;

    @Field(type = FieldType.Keyword)
    private String product;

    @Field(type = FieldType.Keyword)
    private String industry;

    @Field(type = FieldType.Double)
    private Double amount;

    @Field(type = FieldType.Integer)
    private Integer winRate;

    @Field(type = FieldType.Keyword)
    private String priority;

    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String manager;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Text)
    private String nextAction;

    @Field(type = FieldType.Date)
    private String createdAt;

    @Field(type = FieldType.Date)
    private String updatedAt;
}
