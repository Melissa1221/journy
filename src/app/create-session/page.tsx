"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ShareSessionDialog from "@/components/ShareSessionDialog";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { createTrip } from "@/lib/api/sessions";

export default function CreateSession() {
  const [sessionName, setSessionName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionName.trim() || !startDate || !endDate) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (!session?.access_token) {
      setError("Debes iniciar sesión para crear una sesión");
      router.push("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const trip = await createTrip(
        {
          name: sessionName.trim(),
          start_date: startDate,
          end_date: endDate,
          location: location.trim() || undefined,
        },
        session.access_token
      );

      setSessionCode(trip.session_code);
      setShowShareDialog(true);
    } catch (err) {
      console.error("Error creating trip:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al crear la sesión. Intenta de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    setShowShareDialog(false);
    // Navigate to the session using the actual code from the API
    router.push(`/session/${sessionCode}`);
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {/* Error message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
                  {error}
                </div>
              )}

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
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Dale un nombre descriptivo para que todos lo reconozcan
                </p>
              </div>

              {/* Location (optional) */}
              <div>
                <Label htmlFor="location" className="text-base font-semibold mb-3 block">
                  Ubicación <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Ej: Cusco, Perú"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-14 text-base"
                  disabled={isSubmitting}
                />
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                  disabled={!sessionName.trim() || !startDate || !endDate || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creando sesión...
                    </>
                  ) : (
                    "Crear sesión"
                  )}
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
