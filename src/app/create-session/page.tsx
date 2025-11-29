"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ShareSessionDialog from "@/components/ShareSessionDialog";
import BackButton from "@/components/BackButton";

export default function CreateSession() {
  const [sessionName, setSessionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const router = useRouter();

  const generateSessionCode = () => {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionName.trim() && startDate && endDate) {
      const code = generateSessionCode();
      setSessionCode(code);
      setShowShareDialog(true);
    }
  };

  const handleContinue = () => {
    setShowShareDialog(false);
    router.push("/session/1");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <BackButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Nueva Sesión</h1>
            <p className="text-muted-foreground">
              Crea una nueva sesión para gestionar gastos con tu grupo
            </p>
          </div>

          <Card className="rounded-2xl shadow-card p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Session Name */}
              <div>
                <Label htmlFor="sessionName" className="text-base font-semibold mb-3 block">
                  Nombre de la sesión
                </Label>
                <Input
                  id="sessionName"
                  placeholder="Ej: Viaje a Cusco, Almuerzo familiar..."
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="h-14 text-base"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Dale un nombre descriptivo para que todos lo reconozcan
                </p>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-base font-semibold mb-3 block">
                    Fecha de inicio
                  </Label>
                  <div className="relative">
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-14 text-base"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endDate" className="text-base font-semibold mb-3 block">
                    Fecha de fin
                  </Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-14 text-base"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <Card className="bg-accent/10 border-accent/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-accent-foreground mb-1">
                      Invita a tu grupo
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Una vez creada la sesión, podrás compartir un código para que tu grupo se una sin necesidad de registro
                    </p>
                  </div>
                </div>
              </Card>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!sessionName.trim() || !startDate || !endDate}
                >
                  Crear sesión
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <ShareSessionDialog
        open={showShareDialog}
        onOpenChange={handleContinue}
        sessionName={sessionName}
        sessionCode={sessionCode}
      />
    </div>
  );
}
