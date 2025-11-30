"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ArrowRight, Camera, Loader2, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { getTripByCode, joinTrip, TripPublicInfo } from "@/lib/api/sessions";

export default function JoinSession() {
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripPublicInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { session, user, loading: authLoading } = useAuth();

  // Fetch trip info on mount
  useEffect(() => {
    async function fetchTripInfo() {
      try {
        const trip = await getTripByCode(code);
        if (!trip) {
          setError("No se encontró la sesión. Verifica el código e intenta de nuevo.");
        } else {
          setTripInfo(trip);
        }
      } catch (err) {
        console.error("Error fetching trip:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar la sesión. Intenta de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchTripInfo();
  }, [code]);

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

  const handleJoin = async () => {
    if (!tripInfo) return;

    // For authenticated users, use their account name
    // For anonymous users, require a display name
    const displayName = user?.user_metadata?.full_name || name.trim();

    if (!displayName) {
      setError("Por favor ingresa tu nombre");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const joinResult = await joinTrip(tripInfo.id, {
        accessToken: session?.access_token,
        displayName: !session ? displayName : undefined,
      });

      // Store user profile in localStorage for the session page
      const userProfile = {
        name: displayName,
        image: profileImage,
        anonymousToken: joinResult.anonymous_token,
        tripId: tripInfo.id,
      };
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      // Navigate to the session
      router.push(`/session/${code}`);
    } catch (err) {
      console.error("Error joining trip:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al unirse a la sesión. Intenta de nuevo."
      );
      setIsJoining(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Show loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Show error state if trip not found
  if (error && !tripInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl shadow-card p-8 text-center">
            <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sesión no encontrada</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Volver al inicio
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // If user is authenticated, show simplified join flow
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <BackButton fallbackUrl="/" />
          </div>
          <Card className="rounded-2xl shadow-card p-8">
            <div className="text-center mb-8">
              <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
                {user.user_metadata?.avatar_url ? (
                  <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || "User"} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-12 w-12 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
              <h1 className="text-3xl font-bold mb-2 mt-4">Únete a la sesión</h1>
              <p className="text-xl font-semibold text-primary">{tripInfo?.name}</p>
              {tripInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(tripInfo.start_date)} - {formatDate(tripInfo.end_date)}
                </p>
              )}
              {tripInfo?.location && (
                <p className="text-sm text-muted-foreground">{tripInfo.location}</p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Unirse como</p>
                <p className="font-semibold">{user.user_metadata?.full_name || user.email}</p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleJoin}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uniéndose...
                  </>
                ) : (
                  <>
                    Entrar a la sesión
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Anonymous user join flow
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
            <p className="text-xl font-semibold text-primary">{tripInfo?.name}</p>
            {tripInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(tripInfo.start_date)} - {formatDate(tripInfo.end_date)}
              </p>
            )}
            {tripInfo?.location && (
              <p className="text-sm text-muted-foreground">{tripInfo.location}</p>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm mb-6">
              {error}
            </div>
          )}

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
                disabled={isJoining}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Foto de perfil <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Button
                type="button"
                variant="outline"
                className="w-full h-14"
                onClick={() => fileInputRef.current?.click()}
                disabled={isJoining}
              >
                <Camera className="mr-2 h-5 w-5" />
                {profileImage ? "Cambiar foto" : "Tomar o elegir foto"}
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!name.trim() || isJoining}
              onClick={handleJoin}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uniéndose...
                </>
              ) : (
                <>
                  Entrar a la sesión
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
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
