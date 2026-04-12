"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "@/stores/authStore";

type Handler = (payload: any) => void;

export function useWebSocket(
  destination: string | null,
  onMessage: Handler,
) {
  const clientRef = useRef<Client | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!destination) return;
    const wsUrl = typeof window !== "undefined"
      ? `${window.location.origin}/ws`
      : "/ws";

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        client.subscribe(destination, (msg) => {
          try { onMessage(JSON.parse(msg.body)); }
          catch { onMessage(msg.body); }
        });
      },
      onStompError: (f) => console.error("STOMP error:", f),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [destination, token, onMessage]);
}
