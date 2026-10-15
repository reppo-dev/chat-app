"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import {
  setConnected,
  setOnlineUsers,
  setUserTyping,
  userConnected,
  userDisconnected,
} from "@/lib/redux/slices/realtimeSlice";
import { incrementUnread } from "@/lib/redux/slices/chatSlice";
import { logout, setCredentials } from "@/lib/redux/slices/authSlice";
import authApi from "@/lib/api/auth.api";
import {
  CommentPayload,
  CurrentUsersPayload,
  MessagePayload,
  OnlineOfflinePayload,
  ReactionPayload,
  RealtimeEvent,
  RealtimeEventType,
  TypingPayload,
} from "@/lib/types";

interface WebSocketContextType {
  sendTyping: (conversationId: number, isTyping: boolean) => void;
  sendHeartbeat: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  sendTyping: () => {},
  sendHeartbeat: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isRefreshingTokenRef = useRef(false);

  const sendEvent = useCallback(
    (event: { event_type: RealtimeEventType; payload: Record<string, unknown> }) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(event));
      }
    },
    []
  );

  const sendTyping = useCallback(
    (conversationId: number, isTyping: boolean) => {
      sendEvent({
        event_type: "typing",
        payload: {
          conversation_id: conversationId,
          is_typing: isTyping,
        },
      });
    },
    [sendEvent]
  );

  const sendHeartbeat = useCallback(() => {
    sendEvent({
      event_type: "heartbeat",
      payload: { timestamp: Date.now() },
    });
  }, [sendEvent]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      dispatch(setConnected(false));
      return;
    }

    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted || !token) return;

      // Determine correct host (matching current hostname to avoid localhost vs 127.0.0.1 mismatch)
      let apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase && typeof window !== "undefined") {
        const host = window.location.hostname || "localhost";
        apiBase = `http://${host}:9090`;
      }
      const base = apiBase || "http://localhost:9090";
      const wsProtocol = base.startsWith("https") ? "wss" : "ws";
      const host = base.replace(/^https?:\/\//, "");
      const wsUrl = `${wsProtocol}://${host}/ws?token=${encodeURIComponent(
        token
      )}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          dispatch(setConnected(true));
          reconnectDelayRef.current = 1000;

          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  event_type: "heartbeat",
                  payload: { timestamp: Date.now() },
                })
              );
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data: RealtimeEvent = JSON.parse(event.data);

            switch (data.event_type) {
              case "current_users": {
                const payload = data.payload as CurrentUsersPayload;
                const onlineIds = payload?.online_user_ids || [];
                dispatch(setOnlineUsers(onlineIds));
                break;
              }

              case "online": {
                const payload = data.payload as OnlineOfflinePayload;
                const userId = payload?.id;
                if (userId) {
                  dispatch(userConnected(Number(userId)));
                }
                break;
              }

              case "offline": {
                const payload = data.payload as OnlineOfflinePayload;
                const userId = payload?.id;
                if (userId) {
                  dispatch(userDisconnected(Number(userId)));
                }
                break;
              }

              case "message": {
                const payload = data.payload as MessagePayload;
                const msg = payload?.message;
                if (msg) {
                  queryClient.invalidateQueries({
                    queryKey: ["messages", msg.conversation_id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["conversations"],
                  });
                  dispatch(incrementUnread(msg.conversation_id));
                }
                break;
              }

              case "typing": {
                const payload = data.payload as TypingPayload;
                const { conversation_id, user_id, user_name, is_typing } =
                  payload || {};
                if (conversation_id && user_id) {
                  dispatch(
                    setUserTyping({
                      conversationId: Number(conversation_id),
                      userId: Number(user_id),
                      userName: user_name || "User",
                      isTyping: !!is_typing,
                    })
                  );
                }
                break;
              }

              case "notification": {
                queryClient.invalidateQueries({
                  queryKey: ["notifications"],
                });
                break;
              }

              case "friend_request": {
                queryClient.invalidateQueries({
                  queryKey: ["friend_requests_received"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["notifications"],
                });
                break;
              }

              case "friendship_created": {
                queryClient.invalidateQueries({
                  queryKey: ["friends"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["friend_requests_received"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["friend_requests_sent"],
                });
                break;
              }

              case "reaction": {
                const payload = data.payload as ReactionPayload;
                if (payload?.post_id) {
                  queryClient.invalidateQueries({
                    queryKey: ["reactions", payload.post_id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["feed"],
                  });
                }
                break;
              }

              case "comment": {
                const payload = data.payload as CommentPayload;
                if (payload?.post_id) {
                  queryClient.invalidateQueries({
                    queryKey: ["comments", payload.post_id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["feed"],
                  });
                }
                break;
              }

              default:
                break;
            }
          } catch (err) {
            console.warn("Failed to parse WebSocket message:", err);
          }
        };

        ws.onclose = async (closeEvent) => {
          if (isUnmounted) return;
          dispatch(setConnected(false));
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
          }

          // Normal closure (1000) does not need auto-recovery
          if (closeEvent.code === 1000) {
            return;
          }

          // If handshake was rejected (e.g. 1006 / 4001), try refreshing token once
          if (
            (closeEvent.code === 1006 || closeEvent.code === 4001) &&
            !isRefreshingTokenRef.current
          ) {
            isRefreshingTokenRef.current = true;
            try {
              const refreshRes = await authApi.refreshSession();
              const newAccessToken = refreshRes.data?.data?.access_token;
              if (newAccessToken && !isUnmounted) {
                dispatch(setCredentials({ token: newAccessToken }));
                isRefreshingTokenRef.current = false;
                return; // setCredentials will trigger useEffect with new valid token!
              }
            } catch {
              // Session expired -> logout cleanly
              if (!isUnmounted) {
                dispatch(logout());
              }
              isRefreshingTokenRef.current = false;
              return;
            }
            isRefreshingTokenRef.current = false;
          }

          // Exponential backoff reconnect
          const delay = Math.min(reconnectDelayRef.current, 10000);
          reconnectDelayRef.current = delay * 1.5;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmounted && isAuthenticated && token) {
              connectWebSocket();
            }
          }, delay);
        };

        ws.onerror = () => {
          // Note: Do not call ws.close() or log console.error here.
          // Browser will fire onclose automatically, and console.error triggers Next.js dev overlay.
        };
      } catch (err) {
        console.warn("WebSocket initialization notice:", err);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        // Suppress premature-close errors during React StrictMode / Fast Refresh unmounts
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.onmessage = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      dispatch(setConnected(false));
    };
  }, [isAuthenticated, token, dispatch, queryClient]);

  return (
    <WebSocketContext.Provider value={{ sendTyping, sendHeartbeat }}>
      {children}
    </WebSocketContext.Provider>
  );
};
