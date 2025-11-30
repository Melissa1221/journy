"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Settings, Plus, TrendingUp, MessageSquare, Wifi, WifiOff, Users, Wallet } from "lucide-react";
import Header from "@/components/Header";
import ShareSessionDialog from "@/components/ShareSessionDialog";
import FinalizeSessionModal from "@/components/FinalizeSessionModal";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ChatInput } from "@/components/chat/ChatInput";
import { useJourniChat } from "@/hooks/useJourniChat";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "@/hooks/use-toast";

export default function Session() {
  const params = useParams();
  const sessionId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const hasConnectedRef = useRef(false);
  const stableNameRef = useRef<string | null>(null);

  // Get stable display name - only set once to avoid reconnections
  const displayName = (() => {
    // If we already have a stable name, use it
    if (stableNameRef.current) {
      return stableNameRef.current;
    }

    // Wait for auth to load before determining name
    if (authLoading) {
      return null;
    }

    let name: string;

    // First priority: authenticated user's name
    if (user?.user_metadata?.full_name) {
      name = user.user_metadata.full_name;
    } else if (typeof window !== "undefined") {
      // Check for anonymous user profile from join flow
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          if (profile.name) {
            name = profile.name;
          } else {
            name = `Invitado_${Math.random().toString(36).slice(2, 6)}`;
          }
        } catch {
          name = `Invitado_${Math.random().toString(36).slice(2, 6)}`;
        }
      } else {
        // Fallback: check for old journi_user_id
        const stored = localStorage.getItem("journi_user_id");
        name = stored || `Invitado_${Math.random().toString(36).slice(2, 6)}`;
      }
    } else {
      name = `Invitado_${Math.random().toString(36).slice(2, 6)}`;
    }

    // Store the stable name
    stableNameRef.current = name;
    return name;
  })();

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

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
    userId: displayName || "loading",
    onError: (error) => console.error("Chat error:", error),
  });

  // Auto-connect on mount (only once, after auth loads)
  useEffect(() => {
    // Don't connect until we have a display name (auth finished loading)
    if (!displayName) {
      console.log("[Session] Waiting for auth to load...");
      return;
    }

    console.log("[Session] useEffect triggered, hasConnected:", hasConnectedRef.current, "displayName:", displayName);

    if (!hasConnectedRef.current) {
      hasConnectedRef.current = true;
      console.log("[Session] Calling connect()");
      connect();
    }

    // Only disconnect on actual unmount (when navigating away)
    return () => {
      console.log("[Session] Cleanup called");
      // Don't reset hasConnectedRef - let the hook manage connection state
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  const handleSendMessage = (content: string, image?: string) => {
    sendMessage(content, image);
  };

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const handleFinalize = async () => {
    // For MVP, we use session code directly since we don't have trip_id
    // The backend will need to lookup by session_code
    const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/summary`);
    if (!response.ok) {
      throw new Error("Failed to get summary");
    }

    // Mark as finalized (in real implementation, would call finalize endpoint)
    setIsFinalized(true);
    toast({
      title: "Viaje finalizado",
      description: "El resumen esta listo para compartir",
    });
  };

  // Session info (will come from backend later)
  const sessionName = "Viaje a Cusco";
  const sessionCode = sessionId.slice(0, 6).toUpperCase();

  // Flatten debts from multi-currency format
  const allDebts = Object.values(sessionState.debts).flat();

  // Calculate spending per person from sessionState expenses
  const spendingPerPerson = sessionState.expenses.reduce((acc, expense) => {
    if (!acc[expense.paid_by]) {
      acc[expense.paid_by] = 0;
    }
    acc[expense.paid_by] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = sessionState.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const spendingData = Object.entries(spendingPerPerson).map(([person, amount]) => ({
    person,
    amount,
    percentage: totalSpent > 0 ? (amount / totalSpent * 100).toFixed(1) : "0"
  }));

  // Show loading while auth is loading
  if (!displayName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

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
                Conectado como <span className="font-medium">{displayName}</span>
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
                            <UserAvatar name={expense.paid_by} size="md" />
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

            {/* Individual Spending Tracker */}
            {spendingData.length > 0 && (
              <Card className="rounded-3xl shadow-card p-6 border-2 border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    Gasto por Persona
                  </h2>
                  <Badge variant="outline" className="text-sm font-semibold">
                    Total: {totalSpent.toFixed(2)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {spendingData.map((data, idx) => (
                    <div key={idx} className="bg-background rounded-2xl p-4 border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={data.person} size="md" />
                          <div>
                            <p className="font-semibold text-foreground">{data.person}</p>
                            <p className="text-xs text-muted-foreground">{data.percentage}% del total</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl text-primary">{data.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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
                        <UserAvatar name={debt.from} size="sm" />
                        <span className="text-sm font-semibold">{debt.from}</span>
                        <span className="text-muted-foreground font-bold">→</span>
                        <UserAvatar name={debt.to} size="sm" />
                        <span className="text-sm font-semibold">{debt.to}</span>
                      </div>
                      <Badge className="bg-accent text-accent-foreground rounded-full px-4 py-1.5 shadow-md font-bold">
                        {debt.amount.toFixed(2)} {debt.currency}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Solo el creador (usuario autenticado) puede finalizar */}
              {!isFinalized && user && (
                <Button
                  className="w-full mt-6 shadow-lg h-12 text-base font-semibold"
                  onClick={() => setShowFinalizeModal(true)}
                >
                  Finalizar Viaje
                </Button>
              )}
              {isFinalized && (
                <div className="text-center mt-6 py-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    Viaje finalizado
                  </p>
                </div>
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

      <FinalizeSessionModal
        open={showFinalizeModal}
        onOpenChange={setShowFinalizeModal}
        sessionName={sessionName}
        sessionCode={sessionCode}
        totalSpent={totalSpent}
        expenseCount={sessionState.expenses.length}
        participants={participants}
        debts={allDebts}
        onFinalize={handleFinalize}
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
            <div key={name} className={isOnline ? "" : "opacity-50"}>
              <UserAvatar
                name={name}
                size="sm"
                showOnlineIndicator
                isOnline={isOnline}
                className="border-2 border-background"
              />
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
