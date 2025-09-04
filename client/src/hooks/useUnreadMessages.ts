import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

export function useUnreadMessages() {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Query for unread count
  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Unread messages WebSocket connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          // Invalidate unread count when new message arrives
          queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Unread messages WebSocket disconnected");
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("Unread messages WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated, user]);

  return {
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    isLoading,
    socket
  };
}