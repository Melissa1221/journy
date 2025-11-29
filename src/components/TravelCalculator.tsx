import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X, Users, DollarSign, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Traveler {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
}

interface Balance {
  name: string;
  balance: number;
}

export const TravelCalculator = () => {
  const [travelers, setTravelers] = useState<Traveler[]>([
    { id: "1", name: "Ana" },
    { id: "2", name: "Diego" },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newTravelerName, setNewTravelerName] = useState("");
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paidBy: "",
  });

  const addTraveler = () => {
    if (newTravelerName.trim()) {
      setTravelers([
        ...travelers,
        { id: Date.now().toString(), name: newTravelerName.trim() },
      ]);
      setNewTravelerName("");
    }
  };

  const removeTraveler = (id: string) => {
    setTravelers(travelers.filter((t) => t.id !== id));
    setExpenses(expenses.filter((e) => e.paidBy !== id));
  };

  const addExpense = () => {
    if (
      newExpense.description.trim() &&
      newExpense.amount &&
      newExpense.paidBy
    ) {
      setExpenses([
        ...expenses,
        {
          id: Date.now().toString(),
          description: newExpense.description.trim(),
          amount: parseFloat(newExpense.amount),
          paidBy: newExpense.paidBy,
        },
      ]);
      setNewExpense({ description: "", amount: "", paidBy: "" });
    }
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const calculateBalances = (): Balance[] => {
    if (travelers.length === 0) return [];

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const perPerson = totalExpenses / travelers.length;

    return travelers.map((traveler) => {
      const paid = expenses
        .filter((e) => e.paidBy === traveler.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const balance = paid - perPerson;
      return {
        name: traveler.name,
        balance: Math.round(balance * 100) / 100,
      };
    });
  };

  const balances = calculateBalances();
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Prueba la calculadora
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Agrega viajeros, registra gastos y ve cómo se divide todo automáticamente
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Add Travelers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-6 space-y-4 rounded-3xl shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Viajeros</h3>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del viajero..."
                  value={newTravelerName}
                  onChange={(e) => setNewTravelerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTraveler()}
                  className="flex-1"
                />
                <Button onClick={addTraveler} size="icon" variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {travelers.map((traveler) => (
                    <motion.div
                      key={traveler.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-between bg-background p-3 rounded-2xl"
                    >
                      <span className="font-medium text-foreground">
                        {traveler.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeTraveler(traveler.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>

          {/* Add Expenses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="p-6 space-y-4 rounded-3xl shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Gastos</h3>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="¿Qué compraste?"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, description: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Monto ($)"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />
                <select
                  value={newExpense.paidBy}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, paidBy: e.target.value })
                  }
                  className="w-full h-12 rounded-full border-2 border-input bg-card px-5 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-smooth"
                >
                  <option value="">¿Quién pagó?</option>
                  {travelers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Button onClick={addExpense} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar gasto
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <AnimatePresence>
                  {expenses.map((expense) => {
                    const payer = travelers.find((t) => t.id === expense.paidBy);
                    return (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-between bg-background p-3 rounded-2xl"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">
                            {expense.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payer?.name} pagó ${expense.amount.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeExpense(expense.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-6 space-y-6 rounded-3xl shadow-card sticky top-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">
                Balance automático
              </h3>
            </div>

            {travelers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Agrega viajeros para comenzar</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Agrega gastos para ver el balance</p>
              </div>
            ) : (
              <>
                <div className="bg-primary/10 rounded-2xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total gastado
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    ${totalExpenses.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(totalExpenses / travelers.length).toFixed(2)} por persona
                  </p>
                </div>

                <div className="space-y-3">
                  {balances.map((balance, index) => (
                    <motion.div
                      key={balance.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-background rounded-2xl"
                    >
                      <span className="font-semibold text-foreground">
                        {balance.name}
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          balance.balance > 0
                            ? "text-accent-dark"
                            : balance.balance < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {balance.balance > 0
                          ? `+$${balance.balance.toFixed(2)}`
                          : balance.balance < 0
                          ? `-$${Math.abs(balance.balance).toFixed(2)}`
                          : "$0.00"}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-accent/20 rounded-2xl p-4 text-sm text-foreground">
                  <p className="font-semibold mb-2">💡 Resumen:</p>
                  <ul className="space-y-1 text-xs">
                    {balances
                      .filter((b) => b.balance > 0)
                      .map((b) => (
                        <li key={b.name}>
                          <span className="font-medium">{b.name}</span> debe
                          recibir ${b.balance.toFixed(2)}
                        </li>
                      ))}
                    {balances
                      .filter((b) => b.balance < 0)
                      .map((b) => (
                        <li key={b.name}>
                          <span className="font-medium">{b.name}</span> debe
                          pagar ${Math.abs(b.balance).toFixed(2)}
                        </li>
                      ))}
                  </ul>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
