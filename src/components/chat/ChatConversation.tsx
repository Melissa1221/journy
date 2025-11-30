"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import type { ChatMessage as ChatMessageType, ThinkingStep } from "@/hooks/useJourniChat";
import { ChatMessage, ChatStreamingMessage } from "./ChatMessage";

interface ChatConversationProps {
  messages: ChatMessageType[];
  streamingContent?: string;
  isTyping?: boolean;
  thinkingSteps?: ThinkingStep[];
  className?: string;
}

export function ChatConversation({
  messages,
  streamingContent = "",
  isTyping = false,
  thinkingSteps = [],
  className,
}: ChatConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isTyping]);

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <ScrollArea className={cn("flex-1", className)} ref={scrollRef}>
      <div className="p-6 space-y-4">
        {isEmpty ? (
          <ChatEmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming message */}
            {(isTyping || streamingContent) && (
              <ChatStreamingMessage
                content={streamingContent}
                isTyping={isTyping}
                thinkingSteps={thinkingSteps}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-accent-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        ¡Bienvenido a Journi!
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Escribe un gasto como &quot;Pagué 50 por el taxi&quot; o pregunta &quot;¿Cuánto debo?&quot;
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        <SuggestionChip>Pagué 50 por el almuerzo</SuggestionChip>
        <SuggestionChip>¿Cuánto debo?</SuggestionChip>
        <SuggestionChip>Lista de gastos</SuggestionChip>
      </div>
    </div>
  );
}

function SuggestionChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-full text-xs text-muted-foreground cursor-pointer transition-colors">
      {children}
    </div>
  );
}
