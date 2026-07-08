import { useEffect, useState, useCallback } from 'react';

interface Notification { type: string; title: string; content: string; timestamp: string; }

interface WebSocketState {
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  markAllRead: () => void;
}

// 简化 STOMP 客户端 (不依赖外部库，用原生 WebSocket + 简单协议)
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;
const listeners = new Set<() => void>();

function notifyListeners() { listeners.forEach(fn => fn()); }

let connected = false;
const notificationCache: Notification[] = [];
let unread = 0;

function doConnect(token: string) {
  if (ws) return;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    connected = true;
    // STOMP CONNECT
    ws!.send(`CONNECT\naccept-version:1.1\nauthorization:Bearer ${token}\n\n\0`);
    // 订阅通知频道
    ws!.send(`SUBSCRIBE\nid:sub-0\ndestination:/user/queue/notify\n\n\0`);
    notifyListeners();
  };

  ws.onmessage = (event) => {
    const text = event.data;
    // STOMP MESSAGE 帧解析
    if (text.startsWith('MESSAGE')) {
      const bodyIdx = text.indexOf('\n\n');
      if (bodyIdx < 0) return;
      const body = text.substring(bodyIdx + 2).replace('\0', '');
      try {
        const msg = JSON.parse(body);
        const notif: Notification = {
          type: msg.type || 'info', title: msg.data?.title || msg.type,
          content: msg.data?.content || JSON.stringify(msg.data),
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        notificationCache.unshift(notif);
        if (notificationCache.length > 50) notificationCache.pop();
        unread++;
        notifyListeners();
      } catch {}
    }
  };

  ws.onclose = () => { connected = false; ws = null; notifyListeners(); scheduleReconnect(token); };
  ws.onerror = () => { ws?.close(); };
}

function doDisconnect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (ws) { ws.close(); ws = null; }
  connected = false;
  notifyListeners();
}

function scheduleReconnect(token: string) {
  if (reconnectTimer) return;
  reconnectTimer = window.setTimeout(() => { reconnectTimer = null; doConnect(token); }, 5000);
}

export function useWebSocket(): WebSocketState {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const fn = () => forceUpdate(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return {
    connected,
    notifications: notificationCache,
    unreadCount: unread,
    connect: useCallback(() => {
      const token = localStorage.getItem('beike_token');
      if (token) doConnect(token);
    }, []),
    disconnect: doDisconnect,
    markAllRead: useCallback(() => { unread = 0; notifyListeners(); }, []),
  };
}
