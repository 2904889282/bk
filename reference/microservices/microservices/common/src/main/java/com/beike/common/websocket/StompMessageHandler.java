package com.beike.common.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;
import java.time.Instant;
import java.util.Map;

/**
 * STOMP 消息处理器
 * 客户端: stompClient.send("/app/msg", {}, JSON.stringify({to, content}))
 * 订阅:   stompClient.subscribe("/user/queue/notify", callback)
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class StompMessageHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /** 点对点私信 */
    @MessageMapping("/msg")
    public void handlePrivateMessage(@Payload Map<String, String> payload, Principal principal) {
        String to = payload.get("to");
        String content = payload.get("content");
        var msg = Map.of(
                "from", principal.getName(), "to", to,
                "content", content, "timestamp", Instant.now().toString()
        );
        // 推送到目标的个人队列
        messagingTemplate.convertAndSendToUser(to, "/queue/chat", msg);
    }

    /** 全局广播 (仅管理员) */
    @MessageMapping("/broadcast")
    public void broadcast(@Payload Map<String, String> payload) {
        var msg = Map.of(
                "type", "broadcast",
                "content", payload.get("content"),
                "timestamp", Instant.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/system", msg);
    }

    /** 推送给指定用户 (编程调用) */
    public void pushToUser(String userId, String type, Object data) {
        var msg = Map.of("type", type, "data", data, "timestamp", Instant.now().toString());
        messagingTemplate.convertAndSendToUser(userId, "/queue/notify", msg);
    }

    /** 推送到主题 */
    public void pushToTopic(String topic, Object data) {
        messagingTemplate.convertAndSend("/topic/" + topic, data);
    }
}
