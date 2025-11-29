"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ArrowRight, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function JoinSession() {
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoin = () => {
    if (name.trim() && profileImage) {
      // Store in localStorage for demo purposes
      localStorage.setItem('userProfile', JSON.stringify({ name, image: profileImage }));
      router.push(`/session/${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <BackButton fallbackUrl="/" />
        </div>
        <Card className="rounded-2xl shadow-card p-8">
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4">
            <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
              {profileImage ? (
                <AvatarImage src={profileImage} alt={name || "User"} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  <User className="h-12 w-12 text-primary" />
                </AvatarFallback>
              )}
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-1/2 translate-x-12 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary-dark transition-all"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Únete a la sesión</h1>
          <p className="text-muted-foreground">Viaje a Cusco</p>
          <p className="text-sm text-muted-foreground mt-1">15-20 Diciembre 2024</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground block mb-2">
              ¿Cómo te llamas?
            </label>
            <Input
              id="name"
              placeholder="Escribe tu nombre..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="h-14 text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Sube tu foto de perfil
            </label>
            <Button
              type="button"
              variant="outline"
              className="w-full h-14"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mr-2 h-5 w-5" />
              {profileImage ? "Cambiar foto" : "Tomar o elegir foto"}
            </Button>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!name.trim() || !profileImage}
            onClick={handleJoin}
          >
            Entrar a la sesión
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              ¿Ya tienes una cuenta?
            </p>
            <Button variant="ghost" size="sm" onClick={() => router.push("/auth")}>
              Iniciar sesión
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
