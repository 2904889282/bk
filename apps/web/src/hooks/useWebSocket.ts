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

/** 清除所有认证信息并跳转到登录页 */
function redirectToLogin() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  ['beike_token', 'beike_refresh_token', 'beike_user'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/** 尝试使用 refreshToken 获取新 token，成功后自动重连 */
async function handleTokenRefresh() {
  const refreshToken = localStorage.getItem('beike_refresh_token') || sessionStorage.getItem('beike_refresh_token');
  if (!refreshToken) {
    redirectToLogin();
    return;
  }
  try {
    const resp = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!resp.ok) { redirectToLogin(); return; }
    const body = await resp.json();
    const newToken = body?.data?.token || body?.token;
    if (newToken) {
      const store = localStorage.getItem('beike_token') ? localStorage : sessionStorage;
      store.setItem('beike_token', newToken);
      if (body?.data?.refreshToken || body?.refreshToken) {
        store.setItem('beike_refresh_token', body?.data?.refreshToken || body?.refreshToken);
      }
      doConnect(newToken);
    } else {
      redirectToLogin();
    }
  } catch {
    redirectToLogin();
  }
}

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

  ws.onclose = (event) => {
    connected = false; ws = null; notifyListeners();
    // 认证失败（策略违规 1008 或自定义认证失败码 4401），尝试刷新 token 后重连
    if (event.code === 1008 || event.code === 4401) {
      handleTokenRefresh();
      return;
    }
    scheduleReconnect(token);
  };
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
