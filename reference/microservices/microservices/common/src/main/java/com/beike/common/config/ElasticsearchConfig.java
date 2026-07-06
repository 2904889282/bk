package com.beike.common.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

/**
 * Elasticsearch 8 搜索配置
 * - Spring Data Elasticsearch 自动管理索引
 * - IK 中文分词 (已在 Dockerfile 预装 ik_max_word / ik_smart)
 * - 索引: beike_pipelines (管线搜索)
 */
@Configuration
@EnableElasticsearchRepositories(basePackages = "com.beike.*.repository.search")
public class ElasticsearchConfig {

    @Value("${spring.elasticsearch.uris:http://elasticsearch:9200}")
    private String esUris;

    @Bean
    public ElasticsearchClient elasticsearchClient() {
        RestClient restClient = RestClient.builder(HttpHost.create(esUris)).build();
        ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
        return new ElasticsearchClient(transport);
    }

    @Bean
    public ElasticsearchOperations elasticsearchOperations(ElasticsearchClient client) {
        return new ElasticsearchTemplate(client);
    }
}
