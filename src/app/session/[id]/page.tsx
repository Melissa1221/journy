"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Share2, Settings, Plus, TrendingUp, MessageSquare, Wallet, User } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import ShareSessionDialog from "@/components/ShareSessionDialog";

export default function Session() {
  const [message, setMessage] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Mock session data
  const sessionName = "Viaje a Cusco";
  const sessionCode = "ABC123";

  // Mock data
  const expenses = [
    { id: 1, person: "Juan", amount: 50, description: "Almuerzo en el restaurante", time: "10:30 AM" },
    { id: 2, person: "María", amount: 30, description: "Taxi al aeropuerto", time: "11:45 AM" },
    { id: 3, person: "Pedro", amount: 80, description: "Hotel primera noche", time: "2:30 PM" },
    { id: 4, person: "Ana", amount: 25, description: "Desayuno café", time: "8:00 AM" },
  ];

  const summary = [
    { from: "Juan", to: "María", amount: 15 },
    { from: "Pedro", to: "Juan", amount: 20 },
    { from: "Ana", to: "María", amount: 10 },
  ];

  const chatMessages = [
    { id: 1, person: "Juan", message: "Pagué 50 soles por el almuerzo", time: "10:30", isBot: false },
    { id: 2, person: "Bot", message: "✅ Registrado: Juan pagó S/50 por almuerzo. Dividido entre 4 personas.", time: "10:30", isBot: true },
    { id: 3, person: "María", message: "El taxi costó 30", time: "11:45", isBot: false },
    { id: 4, person: "Bot", message: "✅ Registrado: María pagó S/30 por taxi.", time: "11:45", isBot: true },
  ];

  // Calculate spending per person
  const spendingPerPerson = expenses.reduce((acc, expense) => {
    if (!acc[expense.person]) {
      acc[expense.person] = 0;
    }
    acc[expense.person] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const spendingData = Object.entries(spendingPerPerson).map(([person, amount]) => ({
    person,
    amount,
    percentage: (amount / totalSpent * 100).toFixed(1)
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Header */}
      <header className="bg-gradient-to-br from-card via-background to-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Chatbot de Gastos</h1>
              <p className="text-muted-foreground mt-1">Viaje a Cusco · 15-20 Diciembre 2024</p>
            </div>
            <div className="flex gap-2">
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

      {/* Main Content - Desktop: Side by side, Mobile: Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Chat Panel */}
          <Card className="rounded-3xl shadow-card overflow-hidden flex flex-col h-[calc(100vh-250px)] border-2 border-border/50">
            <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 px-6 py-4 border-b border-border/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Chat del Grupo
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Agrega gastos por voz o texto</p>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isBot ? 'justify-end' : 'justify-start'}`}>
                    {!msg.isBot && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-secondary text-foreground">
                          {msg.person[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] ${msg.isBot ? 'text-right' : ''}`}>
                      {!msg.isBot && (
                        <p className="text-xs text-muted-foreground mb-1 px-1">{msg.person} · {msg.time}</p>
                      )}
                      <div className={`rounded-2xl px-4 py-3 shadow-soft ${msg.isBot
                          ? 'bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 text-foreground'
                          : 'bg-card border border-border'
                        }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                    {msg.isBot && (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un gasto o pregunta..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-full h-12 bg-background border-border shadow-soft"
                />
                <Button size="icon" className="flex-shrink-0 h-12 w-12 rounded-full shadow-lg">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
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
                </h2>
                <Button size="sm" className="shadow-lg rounded-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="bg-background rounded-2xl p-4 border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-secondary text-foreground">
                              {expense.person[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{expense.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{expense.person} · {expense.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-primary">S/ {expense.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Individual Spending Tracker */}
            <Card className="rounded-3xl shadow-card p-6 border-2 border-border/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-primary" />
                  Gasto por Persona
                </h2>
                <Badge variant="outline" className="text-sm font-semibold">
                  Total: S/ {totalSpent}
                </Badge>
              </div>

              <div className="space-y-3">
                {spendingData.map((data, idx) => (
                  <div key={idx} className="bg-background rounded-2xl p-4 border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {data.person[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{data.person}</p>
                          <p className="text-xs text-muted-foreground">{data.percentage}% del total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl text-primary">S/ {data.amount}</p>
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

            {/* Summary */}
            <Card className="rounded-3xl shadow-card p-6 bg-gradient-to-br from-card via-secondary/30 to-background border-2 border-border/50">
              <h3 className="text-xl font-bold mb-6">Resumen de Deudas</h3>
              <div className="space-y-3">
                {summary.map((debt, idx) => (
                  <div key={idx} className="bg-background/80 backdrop-blur rounded-2xl p-4 flex items-center justify-between border border-border/50 shadow-soft">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blueAction/20 text-blueAction text-sm font-semibold">
                          {debt.from[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">{debt.from}</span>
                      <span className="text-muted-foreground font-bold">→</span>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-coral/20 text-foreground text-sm font-semibold">
                          {debt.to[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">{debt.to}</span>
                    </div>
                    <Badge className="bg-accent text-accent-foreground rounded-full px-4 py-1.5 shadow-md font-bold">
                      S/ {debt.amount}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 shadow-lg h-12 text-base font-semibold">
                Marcar como liquidado
              </Button>
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
