"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PartyPopper,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
  Users,
  Receipt,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "@/hooks/use-toast";

interface Debt {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

interface FinalizeSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  sessionCode: string;
  totalSpent: number;
  expenseCount: number;
  participants: string[];
  debts: Debt[];
  onFinalize: () => Promise<void>;
}

const FinalizeSessionModal = ({
  open,
  onOpenChange,
  sessionName,
  sessionCode,
  totalSpent,
  expenseCount,
  participants,
  debts,
  onFinalize,
}: FinalizeSessionModalProps) => {
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [isLoading, setIsLoading] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const handleFinalize = async () => {
    setIsLoading(true);
    try {
      await onFinalize();
      setStep("success");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo finalizar el viaje. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!summaryRef.current) return;

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `resumen-${sessionName.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Imagen guardada",
        description: "El resumen se descargó como imagen",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar la imagen",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const summaryText = `
Resumen del viaje: ${sessionName}

Total gastado: S/${totalSpent.toFixed(2)}
Participantes: ${participants.length}
Gastos registrados: ${expenseCount}

${debts.length > 0 ? "Deudas finales:\n" + debts.map(d => `${d.from} debe ${d.amount.toFixed(2)} ${d.currency} a ${d.to}`).join("\n") : "No hay deudas pendientes"}

Generado con Journi
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resumen - ${sessionName}`,
          text: summaryText,
        });
      } catch (error) {
        // User cancelled or error
        navigator.clipboard.writeText(summaryText);
        toast({
          title: "Copiado al portapapeles",
          description: "El resumen se copió para compartir",
        });
      }
    } else {
      navigator.clipboard.writeText(summaryText);
      toast({
        title: "Copiado al portapapeles",
        description: "El resumen se copió para compartir",
      });
    }
  };

  const handleClose = () => {
    setStep("confirm");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-[24px] max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "confirm" ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <PartyPopper className="h-6 w-6 text-primary" />
                  Finalizar Viaje
                </DialogTitle>
                <DialogDescription className="text-base">
                  Revisa el resumen antes de cerrar la sesion
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Summary Card */}
                <div
                  ref={summaryRef}
                  className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 rounded-2xl p-6 space-y-4"
                >
                  <div className="text-center border-b border-border/50 pb-4">
                    <p className="text-sm text-muted-foreground">Viaje</p>
                    <p className="text-xl font-bold">{sessionName}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        S/{totalSpent.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total gastado</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{participants.length}</p>
                      <p className="text-xs text-muted-foreground">Participantes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{expenseCount}</p>
                      <p className="text-xs text-muted-foreground">Gastos</p>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-center gap-1 py-2">
                    <Users className="h-4 w-4 text-muted-foreground mr-2" />
                    <div className="flex -space-x-2">
                      {participants.slice(0, 5).map((name) => (
                        <UserAvatar
                          key={name}
                          name={name}
                          size="sm"
                          className="border-2 border-background"
                        />
                      ))}
                      {participants.length > 5 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          +{participants.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Debts */}
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Deudas Finales
                    </p>
                    {debts.length === 0 ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 font-medium">Estan a mano!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {debts.map((debt, idx) => (
                          <div
                            key={idx}
                            className="bg-background/80 rounded-xl p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar name={debt.from} size="xs" />
                              <span className="text-sm font-medium">{debt.from}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <UserAvatar name={debt.to} size="xs" />
                              <span className="text-sm font-medium">{debt.to}</span>
                            </div>
                            <Badge className="bg-primary text-primary-foreground">
                              {debt.amount.toFixed(2)} {debt.currency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Atencion:</strong> Una vez finalizado, no se podran agregar mas gastos a este viaje.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleFinalize}
                  disabled={isLoading}
                  className="flex-1 rounded-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Viaje
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <DialogHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <PartyPopper className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>
                <DialogTitle className="text-2xl">Viaje Finalizado!</DialogTitle>
                <DialogDescription className="text-base">
                  {sessionName} ha sido cerrado exitosamente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-6">
                {/* Final Summary */}
                <div
                  ref={summaryRef}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800"
                >
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-green-600">
                      S/{totalSpent.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total gastado en el viaje</p>
                  </div>

                  {debts.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold text-center mb-3">
                        Pagos pendientes
                      </p>
                      {debts.map((debt, idx) => (
                        <div
                          key={idx}
                          className="bg-white/80 dark:bg-background/50 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar name={debt.from} size="xs" />
                            <span className="text-sm">{debt.from}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <UserAvatar name={debt.to} size="xs" />
                            <span className="text-sm">{debt.to}</span>
                          </div>
                          <span className="font-bold text-primary">
                            {debt.amount.toFixed(2)} {debt.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDownloadImage}
                    className="rounded-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Guardar imagen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="rounded-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="w-full rounded-full"
              >
                Cerrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default FinalizeSessionModal;
