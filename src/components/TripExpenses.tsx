import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TripExpenses = () => {
  const expenses = [
    { id: 1, person: "Juan", amount: 50, description: "Almuerzo en el restaurante", date: "15 Oct", time: "10:30 AM" },
    { id: 2, person: "María", amount: 30, description: "Taxi al aeropuerto", date: "15 Oct", time: "11:45 AM" },
    { id: 3, person: "Pedro", amount: 80, description: "Hotel primera noche", date: "16 Oct", time: "2:30 PM" },
    { id: 4, person: "Ana", amount: 25, description: "Desayuno café", date: "16 Oct", time: "8:00 AM" },
    { id: 5, person: "Carlos", amount: 120, description: "Tour por la ciudad", date: "17 Oct", time: "9:00 AM" },
    { id: 6, person: "María", amount: 45, description: "Cena en el puerto", date: "17 Oct", time: "7:30 PM" },
  ];

  const balances = [
    { from: "Juan", to: "María", amount: 35 },
    { from: "Pedro", to: "Carlos", amount: 60 },
    { from: "Ana", to: "María", amount: 20 },
  ];

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const perPerson = (totalExpenses / 5).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gastado</p>
              <p className="text-3xl font-bold text-primary">S/ {totalExpenses}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-accent/20 rounded-full p-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">5</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Por Persona</p>
              <p className="text-3xl font-bold text-accent-foreground">S/ {perPerson}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-blue-light/20 to-blue-light/30 border-blue-deep/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-light/40 rounded-full p-3">
              <Download className="h-6 w-6 text-blue-deep" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registros</p>
              <p className="text-3xl font-bold text-blue-deep">{expenses.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Expenses List */}
      <Card className="rounded-2xl shadow-card overflow-hidden">
        <div className="bg-primary/10 px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Lista de Gastos
          </h2>
          <Button size="sm" variant="pill">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Gasto
          </Button>
        </div>

        <ScrollArea className="h-[400px] p-6">
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-background rounded-xl p-4 border border-border hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {expense.person[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {expense.person} · {expense.date} · {expense.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-primary">S/ {expense.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Balance Summary */}
      <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-card via-secondary/30 to-accent/10">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="bg-accent/20 rounded-full p-2">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
          </div>
          Quién le debe a quién
        </h3>
        <div className="space-y-3">
          {balances.map((balance, idx) => (
            <div
              key={idx}
              className="bg-background/80 backdrop-blur rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all border border-border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-light text-blue-deep font-semibold">
                    {balance.from[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{balance.from}</span>
                <span className="text-muted-foreground text-xl">→</span>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-pink/30 text-foreground font-semibold">
                    {balance.to[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{balance.to}</span>
              </div>
              <Badge variant="secondary" className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-base font-bold">
                S/ {balance.amount}
              </Badge>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="default" className="flex-1">
            Marcar como liquidado
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Exportar Balance
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TripExpenses;
