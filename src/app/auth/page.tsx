"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente",
      });
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) return;

    if (signupPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      // Mostrar pantalla de confirmación de email
      setRegisteredEmail(signupEmail);
      setShowEmailConfirmation(true);
      setIsLoading(false);
    }
  };

  // Pantalla de confirmación de email
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-card p-8">
          <div className="text-center space-y-6">
            {/* Email Icon */}
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-10 w-10 text-primary" />
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                ¡Revisa tu correo!
              </h2>
              <p className="text-muted-foreground">
                Te hemos enviado un email de confirmación a:
              </p>
              <p className="font-semibold text-foreground mt-2">
                {registeredEmail}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-accent/10 rounded-2xl p-4 text-left space-y-2">
              <p className="text-sm text-foreground font-semibold">
                📧 Pasos a seguir:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abre tu bandeja de entrada</li>
                <li>Busca el email de TravelMemory</li>
                <li>Haz click en el enlace de verificación</li>
                <li>¡Listo! Podrás iniciar sesión</li>
              </ol>
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                💡 <span className="font-semibold">Tip:</span> Si no ves el email, revisa tu carpeta de spam
              </p>
            </div>

            {/* Back to login */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                ¿Ya verificaste tu correo?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setSignupName("");
                  setSignupEmail("");
                  setSignupPassword("");
                }}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <BackButton fallbackUrl="/" label="Volver al inicio" />
        </div>

        <Card className="rounded-2xl shadow-card overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none h-16 bg-card">
              <TabsTrigger value="login" className="text-base font-semibold">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-base font-semibold">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="p-8">
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="login-email" className="text-sm font-semibold mb-2 block">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-sm font-semibold mb-2 block">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!loginEmail || !loginPassword || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>

                <div className="text-center">
                  <Button variant="link" size="sm" className="text-muted-foreground">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="p-8">
              <form className="space-y-6" onSubmit={handleSignup}>
                <div>
                  <Label htmlFor="signup-name" className="text-sm font-semibold mb-2 block">
                    Nombre completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email" className="text-sm font-semibold mb-2 block">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-password" className="text-sm font-semibold mb-2 block">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Mínimo 8 caracteres
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!signupName || !signupEmail || !signupPassword || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Al registrarte, aceptas nuestros términos de servicio y política de privacidad
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
