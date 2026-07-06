package com.beike.common.mq;

/**
 * RocketMQ Topic + Consumer Group 常量定义
 */
public final class RocketMQTopics {

    private RocketMQTopics() {}

    // ============================
    // Topic 定义
    // ============================

    /** 管线变更事件 (创建/更新/阶段推进/删除) */
    public static final String TOPIC_PIPELINE_CHANGE = "beike-pipeline-change";

    /** 项目变更事件 */
    public static final String TOPIC_PROJECT_CHANGE = "beike-project-change";

    /** 预警通知 */
    public static final String TOPIC_ALERT_NOTIFY = "beike-alert-notify";

    /** 数据同步 (MySQL → ES) */
    public static final String TOPIC_DATA_SYNC = "beike-data-sync";

    /** 人才负载变更 */
    public static final String TOPIC_TALENT_LOAD = "beike-talent-load";

    // ============================
    // Consumer Group 定义
    // ============================

    /** 搜索索引同步消费组 (Pipeline → ES) */
    public static final String GROUP_SEARCH_SYNC = "beike-search-sync-group";

    /** 通知发送消费组 */
    public static final String GROUP_NOTIFICATION = "beike-notification-group";

    /** 审计日志消费组 */
    public static final String GROUP_AUDIT_LOG = "beike-audit-log-group";

    // ============================
    // Tag 定义
    // ============================

    public static final String TAG_CREATED = "CREATED";
    public static final String TAG_UPDATED = "UPDATED";
    public static final String TAG_DELETED = "DELETED";
    public static final String TAG_STAGE_CHANGE = "STAGE_CHANGE";
    public static final String TAG_ALERT_TRIGGER = "ALERT_TRIGGER";
    public static final String TAG_SYNC_ES = "SYNC_ES";
}
