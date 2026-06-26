package com.beike.common.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * WebSocket + STOMP 实时通信配置
 * 订阅模式: /topic/* (广播) /user/queue/* (点对点)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 客户端订阅前缀 → Broker 广播
        registry.enableSimpleBroker("/topic", "/queue");
        // 服务端接收前缀 → @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
        // 点对点消息 (推送给指定用户)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();             // SockJS 降级兼容
    }
}
