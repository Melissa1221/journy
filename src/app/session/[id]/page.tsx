"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Share2, Settings, Plus, TrendingUp, MessageSquare, Wifi, WifiOff, Users } from "lucide-react";
import Header from "@/components/Header";
import ShareSessionDialog from "@/components/ShareSessionDialog";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ChatInput } from "@/components/chat/ChatInput";
import { useJourniChat } from "@/hooks/useJourniChat";

// Color palette for avatars
const AVATAR_COLORS = ["#FF8750", "#6EBF4E", "#BEE5FF", "#F3E5F5", "#FFE3CC", "#B9E88A"];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function Session() {
  const params = useParams();
  const sessionId = params.id as string;

  // TODO: Get userId from auth context or local storage
  const [userId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("journi_user_id");
      if (stored) return stored;
      const newId = `user_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem("journi_user_id", newId);
      return newId;
    }
    return `user_${Math.random().toString(36).slice(2, 6)}`;
  });

  const [showShareDialog, setShowShareDialog] = useState(false);

  const {
    status,
    connect,
    disconnect,
    messages,
    sendMessage,
    isTyping,
    streamingContent,
    thinkingSteps,
    sessionState,
    participants,
    onlineUsers,
  } = useJourniChat({
    sessionId,
    userId,
    onError: (error) => console.error("Chat error:", error),
  });

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleSendMessage = (content: string, image?: string) => {
    sendMessage(content, image);
  };

  // Session info (will come from backend later)
  const sessionName = "Viaje a Cusco";
  const sessionCode = sessionId.slice(0, 6).toUpperCase();

  // Flatten debts from multi-currency format
  const allDebts = Object.values(sessionState.debts).flat();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <header className="bg-gradient-to-br from-card via-background to-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">Chatbot de Gastos</h1>
                <ConnectionBadge status={status} />
              </div>
              <p className="text-muted-foreground mt-1">{sessionName} · Código: {sessionCode}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Online users */}
              <ParticipantAvatars
                participants={participants}
                onlineUsers={onlineUsers}
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowShareDialog(true)}
                className="shadow-soft"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="shadow-soft">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Chat Panel */}
          <Card className="rounded-3xl shadow-card overflow-hidden flex flex-col h-[calc(100vh-250px)] border-2 border-border/50">
            <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 px-6 py-4 border-b border-border/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Chat del Grupo
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Conectado como <span className="font-medium">{userId}</span>
              </p>
            </div>

            <ChatConversation
              messages={messages}
              streamingContent={streamingContent}
              isTyping={isTyping}
              thinkingSteps={thinkingSteps}
              className="flex-1"
            />

            <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur">
              <ChatInput
                onSend={handleSendMessage}
                disabled={status !== "connected"}
                isTyping={isTyping}
              />
            </div>
          </Card>

          {/* Expenses Panel */}
          <div className="space-y-6">
            {/* Expenses List */}
            <Card className="rounded-3xl shadow-card p-6 border-2 border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Lista de Gastos
                  {sessionState.expenses.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {sessionState.expenses.length}
                    </Badge>
                  )}
                </h2>
              </div>

              <ScrollArea className="h-[320px] pr-4">
                {sessionState.expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No hay gastos registrados
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escribe en el chat para agregar uno
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionState.expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="bg-background rounded-2xl p-4 border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback
                                style={{ backgroundColor: getAvatarColor(expense.paid_by) }}
                                className="text-white font-semibold"
                              >
                                {expense.paid_by[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{expense.description}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {expense.paid_by} · {expense.split_among.length} personas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-primary">
                              {expense.amount.toFixed(2)} {expense.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Debts Summary */}
            <Card className="rounded-3xl shadow-card p-6 bg-gradient-to-br from-card via-secondary/30 to-background border-2 border-border/50">
              <h3 className="text-xl font-bold mb-6">Resumen de Deudas</h3>

              {allDebts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-greenSuccess font-medium">
                    ¡Están a mano!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No hay deudas pendientes
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allDebts.map((debt, idx) => (
                    <div
                      key={idx}
                      className="bg-background/80 backdrop-blur rounded-2xl p-4 flex items-center justify-between border border-border/50 shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            style={{ backgroundColor: getAvatarColor(debt.from) }}
                            className="text-white text-sm font-semibold"
                          >
                            {debt.from[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold">{debt.from}</span>
                        <span className="text-muted-foreground font-bold">→</span>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            style={{ backgroundColor: getAvatarColor(debt.to) }}
                            className="text-white text-sm font-semibold"
                          >
                            {debt.to[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold">{debt.to}</span>
                      </div>
                      <Badge className="bg-accent text-accent-foreground rounded-full px-4 py-1.5 shadow-md font-bold">
                        {debt.amount.toFixed(2)} {debt.currency}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {allDebts.length > 0 && (
                <Button className="w-full mt-6 shadow-lg h-12 text-base font-semibold">
                  Marcar como liquidado
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>

      <ShareSessionDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        sessionName={sessionName}
        sessionCode={sessionCode}
      />
    </div>
  );
}

// Connection status badge
function ConnectionBadge({ status }: { status: string }) {
  const config = {
    connected: { icon: Wifi, label: "Conectado", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    connecting: { icon: Wifi, label: "Conectando...", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    disconnected: { icon: WifiOff, label: "Desconectado", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
    error: { icon: WifiOff, label: "Error", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  }[status] || { icon: WifiOff, label: status, className: "bg-gray-100 text-gray-700" };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Participant avatars with online indicator
function ParticipantAvatars({
  participants,
  onlineUsers,
}: {
  participants: string[];
  onlineUsers: string[];
}) {
  if (participants.length === 0) return null;

  const maxShow = 4;
  const shown = participants.slice(0, maxShow);
  const remaining = participants.length - maxShow;

  return (
    <div className="flex items-center gap-1">
      <Users className="h-4 w-4 text-muted-foreground mr-1" />
      <div className="flex -space-x-2">
        {shown.map((name) => {
          const isOnline = onlineUsers.includes(name);
          return (
            <div key={name} className="relative">
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarFallback
                  style={{
                    backgroundColor: getAvatarColor(name),
                    opacity: isOnline ? 1 : 0.5,
                  }}
                  className="text-white text-xs font-semibold"
                >
                  {name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
          );
        })}
      </div>
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground ml-1">+{remaining}</span>
      )}
    </div>
  );
}
