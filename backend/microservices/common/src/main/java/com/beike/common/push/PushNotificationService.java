package com.beike.common.push;

import com.beike.common.websocket.StompMessageHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * 统一推送服务
 * 渠道: WebSocket 实时 / 企业微信 / 邮件 / 站内信
 *
 * 使用: pushService.send(userId, "管线已创建", "P013 已进入合同阶段")
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final StompMessageHandler wsHandler;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    @Value("${beike.push.wecom-webhook:}")
    private String wecomWebhook;

    // ============================
    // 统一发送 (全渠道)
    // ============================
    @Async
    public void send(String userId, String title, String content) {
        // 1. WebSocket 实时推送
        try {
            wsHandler.pushToUser(userId, "notification",
                    Map.of("title", title, "content", content));
        } catch (Exception e) { log.warn("WS 推送失败: {}", e.getMessage()); }

        // 2. 站内信入库 (异步)
        saveInbox(userId, title, content);
    }

    // ============================
    // 企业微信机器人 Webhook
    // ============================
    @Async
    public void sendWecomBot(String content) {
        if (wecomWebhook.isEmpty()) return;
        try {
            var body = Map.of(
                    "msgtype", "markdown",
                    "markdown", Map.of("content",
                            "## 贝壳管理平台通知\n" +
                            "> " + content + "\n" +
                            "> " + java.time.LocalDateTime.now().toString().substring(0, 19))
            );
            restTemplate.postForEntity(wecomWebhook, body, String.class);
        } catch (Exception e) { log.error("企微推送失败", e); }
    }

    // ============================
    // 批量推送 (管线阶段变更等)
    // ============================
    @Async
    public void sendToRoles(List<String> roleCodes, String title, String content) {
        // 从缓存/DB 查角色对应用户，逐个推送
        log.info("批量推送 [{}]: {} - {}", roleCodes, title, content);
    }

    // ============================
    // 站内信
    // ============================
    void saveInbox(String userId, String title, String content) {
        // TODO: 落库 sys_inbox 表
        log.debug("站内信: [{}] {}", userId, title);
    }
}
