"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function EmailVerified() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-card p-8">
        <div className="text-center space-y-6">
          {/* Success Icon with Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-2">
              ¡Cuenta Verificada! 🎉
            </h2>
            <p className="text-muted-foreground">
              Tu correo electrónico ha sido confirmado exitosamente
            </p>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-green-500/10 rounded-2xl p-4 space-y-2"
          >
            <p className="text-sm text-foreground">
              ✅ Email verificado correctamente
            </p>
            <p className="text-sm text-foreground">
              ✅ Cuenta activada
            </p>
            <p className="text-sm text-foreground">
              ✅ Ya puedes iniciar sesión
            </p>
          </motion.div>

          {/* Auto redirect info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground"
          >
            <p>
              Redirigiendo a inicio de sesión en{" "}
              <span className="font-bold text-primary text-lg">{countdown}</span>{" "}
              segundos...
            </p>
          </motion.div>

          {/* Manual redirect button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-4"
          >
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push("/auth")}
            >
              Ir a Iniciar Sesión
            </Button>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
