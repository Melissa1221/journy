"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType, ThinkingStep } from "@/hooks/useJourniChat";
import { ChatThinking } from "./ChatThinking";
import { UserAvatar } from "@/components/UserAvatar";

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.type === "user";
  const isBot = message.type === "bot";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className={cn("text-center text-sm text-muted-foreground py-2", className)}>
        {message.content}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isBot ? "justify-start" : "justify-end", className)}>
      {/* User avatar on the right (for user messages) */}
      {isUser && message.userId && (
        <div className="flex-shrink-0 order-last">
          <UserAvatar name={message.userId} size="md" />
        </div>
      )}

      <div className={cn("max-w-[75%] flex flex-col", isBot ? "" : "items-end")}>
        {/* Username and time for user messages */}
        {isUser && message.userId && (
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {message.userId} · {formatTime(message.timestamp)}
          </p>
        )}

        {/* Thinking steps for bot messages */}
        {isBot && message.thinkingSteps && message.thinkingSteps.length > 0 && (
          <ChatThinking steps={message.thinkingSteps} isComplete />
        )}

        {/* Message content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-soft",
            isBot
              ? "bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 text-foreground"
              : "bg-card border border-border"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.hasImage && (
            <span className="text-xs text-muted-foreground mt-1 block">📷 Imagen adjunta</span>
          )}
        </div>
      </div>

      {/* Bot avatar on the right */}
      {isBot && (
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-5 w-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
}

interface ChatStreamingMessageProps {
  content: string;
  isTyping: boolean;
  thinkingSteps: ThinkingStep[];
}

export function ChatStreamingMessage({ content, isTyping, thinkingSteps }: ChatStreamingMessageProps) {
  if (!isTyping && !content) return null;

  return (
    <div className="flex gap-3 justify-start">
      <div className="max-w-[75%] flex flex-col">
        {/* Thinking steps while streaming */}
        {thinkingSteps.length > 0 && (
          <ChatThinking steps={thinkingSteps} isComplete={false} />
        )}

        {/* Streaming content or typing indicator */}
        <div className="rounded-2xl px-4 py-3 shadow-soft bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 text-foreground">
          {content ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Pensando...</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="h-5 w-5 text-accent-foreground" />
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
