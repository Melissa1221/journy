"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, Check, Loader2, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface LinkWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WHATSAPP_NUMBER = "+14155238886"; // Twilio Sandbox number
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function LinkWhatsAppDialog({ open, onOpenChange }: LinkWhatsAppDialogProps) {
  const [step, setStep] = useState<"generate" | "waiting" | "success">("generate");
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("generate");
      setVerificationCode(null);
      setCopied(false);
      setIsPolling(false);
    }
  }, [open]);

  // Poll for verification status
  useEffect(() => {
    if (!isPolling || !verificationCode) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/whatsapp/verify-status?code=${verificationCode}`,
          {
            headers: {
              "Authorization": `Bearer ${user?.id}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.verified) {
            setStep("success");
            setIsPolling(false);
            toast({
              title: "WhatsApp vinculado",
              description: "Tu cuenta ahora esta conectada con WhatsApp",
            });
          }
        }
      } catch (error) {
        console.error("Error polling verification status:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling, verificationCode, user?.id, toast]);

  const generateCode = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes iniciar sesion para vincular WhatsApp",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/whatsapp/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          user_email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await response.json();
      setVerificationCode(data.code);
      setStep("waiting");
      setIsPolling(true);
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el codigo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (!verificationCode) return;

    try {
      await navigator.clipboard.writeText(`vincular ${verificationCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado",
        description: "Codigo copiado al portapapeles",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(`vincular ${verificationCode}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Vincular WhatsApp
          </DialogTitle>
          <DialogDescription>
            Conecta tu WhatsApp para registrar gastos desde tu celular
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "generate" && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Como funciona:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Genera un codigo de verificacion</li>
                  <li>Envia el codigo a nuestro WhatsApp</li>
                  <li>Tu cuenta quedara vinculada automaticamente</li>
                </ol>
              </div>

              <Button onClick={generateCode} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Generar codigo
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "waiting" && verificationCode && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Envia este mensaje a WhatsApp:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border text-lg font-mono text-center">
                    vincular {verificationCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={openWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="mr-2 h-4 w-4" />
                Abrir WhatsApp
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Esperando verificacion...
              </div>

              <p className="text-xs text-center text-muted-foreground">
                El codigo expira en 10 minutos
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">WhatsApp Vinculado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ahora puedes enviar mensajes para registrar gastos
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)} className="w-full">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
