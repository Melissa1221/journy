"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Types matching backend
export interface Expense {
  id: string;
  amount: number;
  currency: string;
  description: string;
  paid_by: string;
  split_among: string[];
  timestamp: string;
}

export interface Payment {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

export interface ThinkingStep {
  step: "tool_call" | "tool_result";
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  result?: string;
  status: "active" | "complete";
}

export interface ChatMessage {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  userId?: string;
  timestamp: string;
  hasImage?: boolean;
  thinkingSteps?: ThinkingStep[];
}

export interface SessionState {
  expenses: Expense[];
  payments: Payment[];
  balances: Record<string, Record<string, number>>;
  participants: string[];
  debts: Record<string, Debt[]>;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface UseJourniChatOptions {
  sessionId: string;
  userId: string;
  onError?: (error: Error) => void;
}

interface UseJourniChatReturn {
  // Connection
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;

  // Messages
  messages: ChatMessage[];
  sendMessage: (content: string, image?: string) => void;

  // Streaming state
  isTyping: boolean;
  streamingContent: string;
  thinkingSteps: ThinkingStep[];

  // Session state
  sessionState: SessionState;
  participants: string[];
  onlineUsers: string[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useJourniChat({
  sessionId,
  userId,
  onError,
}: UseJourniChatOptions): UseJourniChatReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>({
    expenses: [],
    payments: [],
    balances: {},
    participants: [],
    debts: {},
  });
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected, skipping");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("[WS] Already connecting, skipping");
      return;
    }

    setStatus("connecting");

    const wsUrl = BACKEND_URL.replace(/^http/, "ws");
    // Encode userId to handle spaces and special characters in names
    const encodedUserId = encodeURIComponent(userId);
    const fullUrl = `${wsUrl}/ws/${sessionId}/${encodedUserId}`;
    console.log("[WS] Connecting to:", fullUrl);

    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected successfully");
      setStatus("connected");
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[WS] Message received:", data.type);
        handleMessage(data);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("[WS] WebSocket error:", error);
      setStatus("error");
      onError?.(new Error("WebSocket connection error"));
    };

    ws.onclose = (event) => {
      console.log("[WS] Connection closed:", event.code, event.reason);
      setStatus("disconnected");
      wsRef.current = null;
    };
  }, [sessionId, userId, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  const handleMessage = useCallback((data: Record<string, unknown>) => {
    const type = data.type as string;
    const timestamp = (data.timestamp as string) || new Date().toISOString();

    switch (type) {
      case "user_message": {
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "user",
          content: data.content as string,
          userId: data.user_id as string,
          timestamp,
          hasImage: data.has_image as boolean,
        };
        setMessages((prev) => [...prev, newMessage]);
        // Clear thinking steps for new conversation turn
        setThinkingSteps([]);
        break;
      }

      case "thinking_step": {
        const step: ThinkingStep = {
          step: data.step as "tool_call" | "tool_result",
          tool_name: data.tool_name as string,
          tool_args: data.tool_args as Record<string, unknown>,
          result: data.result as string,
          status: data.status as "active" | "complete",
        };

        if (step.step === "tool_call") {
          setThinkingSteps((prev) => [...prev, step]);
        } else if (step.step === "tool_result") {
          // Update the last tool call step to complete
          setThinkingSteps((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                result: step.result,
                status: "complete",
              };
            }
            return updated;
          });
        }
        break;
      }

      case "bot_chunk": {
        setStreamingContent((prev) => prev + (data.content as string));
        break;
      }

      case "bot_complete": {
        const content = data.content as string;
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "bot",
          content,
          timestamp,
          thinkingSteps: [...thinkingSteps],
        };
        setMessages((prev) => [...prev, botMessage]);
        setStreamingContent("");
        setIsTyping(false);
        setThinkingSteps([]);

        // Update session state
        if (data.expenses || data.balances || data.participants || data.debts) {
          setSessionState((prev) => ({
            ...prev,
            expenses: (data.expenses as Expense[]) || prev.expenses,
            payments: (data.payments as Payment[]) || prev.payments,
            balances: (data.balances as Record<string, Record<string, number>>) || prev.balances,
            participants: (data.participants as string[]) || prev.participants,
            debts: (data.debts as Record<string, Debt[]>) || prev.debts,
          }));
        }
        break;
      }

      case "bot_typing": {
        setIsTyping(data.active as boolean);
        if (data.active) {
          setStreamingContent("");
        }
        break;
      }

      case "user_joined": {
        const joinedUser = data.user_id as string;
        setOnlineUsers((prev) => [...new Set([...prev, joinedUser])]);
        if (data.participants) {
          setSessionState((prev) => ({
            ...prev,
            participants: data.participants as string[],
          }));
        }

        const systemMessage: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "system",
          content: `${joinedUser} se unió`,
          timestamp,
        };
        setMessages((prev) => [...prev, systemMessage]);
        break;
      }

      case "user_left": {
        const leftUser = data.user_id as string;
        setOnlineUsers((prev) => prev.filter((u) => u !== leftUser));

        const systemMessage: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "system",
          content: `${leftUser} se desconectó`,
          timestamp,
        };
        setMessages((prev) => [...prev, systemMessage]);
        break;
      }

      default:
        console.log("Unknown message type:", type, data);
    }
  }, [thinkingSteps]);

  const sendMessage = useCallback((content: string, image?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const message: { content: string; image?: string } = { content };
    if (image) {
      message.image = image;
    }

    wsRef.current.send(JSON.stringify(message));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    connect,
    disconnect,
    messages,
    sendMessage,
    isTyping,
    streamingContent,
    thinkingSteps,
    sessionState,
    participants: sessionState.participants,
    onlineUsers,
  };
}
