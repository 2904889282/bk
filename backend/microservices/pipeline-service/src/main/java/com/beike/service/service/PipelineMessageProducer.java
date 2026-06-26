package com.beike.service.service;

import com.beike.common.mq.RocketMQTopics;
import com.beike.service.entity.mysql.Pipeline;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.client.producer.SendCallback;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

/**
 * 管线消息生产者 — 异步解耦 CRUD → ES 同步 / 审计日志 / 通知
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineMessageProducer {

    private final RocketMQTemplate rocketMQTemplate;
    private final ObjectMapper objectMapper;

    /** 管线创建事件 */
    public void sendCreated(Pipeline pipeline) {
        sendAsync(RocketMQTopics.TOPIC_PIPELINE_CHANGE, RocketMQTopics.TAG_CREATED, pipeline);
    }

    /** 管线更新事件 */
    public void sendUpdated(Pipeline pipeline) {
        sendAsync(RocketMQTopics.TOPIC_PIPELINE_CHANGE, RocketMQTopics.TAG_UPDATED, pipeline);
    }

    /** 管线删除事件 */
    public void sendDeleted(String pipelineId) {
        var msg = MessageBuilder.withPayload("{\"id\":\"" + pipelineId + "\"}").build();
        rocketMQTemplate.asyncSend(
                RocketMQTopics.TOPIC_PIPELINE_CHANGE + ":" + RocketMQTopics.TAG_DELETED,
                msg,
                new SendCallback() {
                    @Override public void onSuccess(SendResult r) {}
                    @Override public void onException(Throwable e) { log.error("RocketMQ 发送失败: {}", e.getMessage()); }
                }
        );
    }

    /** 阶段推进事件 */
    public void sendStageChange(Pipeline pipeline, String fromStage, String toStage) {
        var msg = MessageBuilder
                .withPayload(objectMapper.valueToTree(pipeline))
                .setHeader("fromStage", fromStage)
                .setHeader("toStage", toStage)
                .build();
        rocketMQTemplate.asyncSend(
                RocketMQTopics.TOPIC_PIPELINE_CHANGE + ":" + RocketMQTopics.TAG_STAGE_CHANGE,
                msg,
                new SendCallback() {
                    @Override public void onSuccess(SendResult r) { log.info("阶段推进消息已投递: {}→{}", fromStage, toStage); }
                    @Override public void onException(Throwable e) { log.error("投递失败", e); }
                }
        );
    }

    private void sendAsync(String topic, String tag, Pipeline pipeline) {
        var msg = MessageBuilder
                .withPayload(objectMapper.valueToTree(pipeline))
                .setHeader("pipelineId", pipeline.getId())
                .setHeader("stage", pipeline.getStage())
                .build();
        rocketMQTemplate.asyncSend(topic + ":" + tag, msg,
                new SendCallback() {
                    @Override public void onSuccess(SendResult r) { log.debug("消息已投递: {}:{}", topic, tag); }
                    @Override public void onException(Throwable e) { log.error("RocketMQ 发送失败 [{}:{}]: {}", topic, tag, e.getMessage()); }
                }
        );
    }
}
