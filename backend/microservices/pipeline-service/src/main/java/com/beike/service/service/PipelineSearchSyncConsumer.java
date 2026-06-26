package com.beike.service.service;

import com.beike.common.mq.RocketMQTopics;
import com.beike.service.entity.es.PipelineDocument;
import com.beike.service.repository.PipelineSearchRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

/**
 * 管线变更 → ES 索引同步消费者
 * 消费组: beike-search-sync-group
 * 消费模式: 集群 (CLUSTERING), 支持多实例水平扩展
 */
@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(
        topic = RocketMQTopics.TOPIC_PIPELINE_CHANGE,
        consumerGroup = RocketMQTopics.GROUP_SEARCH_SYNC,
        selectorExpression = "*",           // 消费全部 Tag
        consumeMode = org.apache.rocketmq.spring.annotation.ConsumeMode.CONCURRENTLY,
        maxReconsumeTimes = 3               // 消费失败最多重试 3 次
)
public class PipelineSearchSyncConsumer implements RocketMQListener<String> {

    private final PipelineSearchRepository searchRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String tag = root.get("tag") != null ? root.get("tag").asText() : "";

            switch (tag) {
                case "CREATED" -> {
                    PipelineDocument doc = objectMapper.treeToValue(root.get("payload"), PipelineDocument.class);
                    searchRepository.save(doc);
                    log.info("ES 索引已创建: {}", doc.getId());
                }
                case "UPDATED" -> {
                    PipelineDocument doc = objectMapper.treeToValue(root.get("payload"), PipelineDocument.class);
                    searchRepository.save(doc);
                    log.info("ES 索引已更新: {}", doc.getId());
                }
                case "DELETED" -> {
                    String id = root.get("payload").get("id").asText();
                    searchRepository.deleteById(id);
                    log.info("ES 索引已删除: {}", id);
                }
                default -> log.debug("忽略 Tag: {}", tag);
            }
        } catch (Exception e) {
            log.error("ES 同步消费失败, 消息将重试: {}", message, e);
            throw new RuntimeException("ES sync failed", e);   // 触发 RocketMQ 重试
        }
    }
}
