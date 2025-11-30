"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Wallet, Map, Camera, Share2, Settings } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import TripExpenses from "@/components/TripExpenses";
import TripMemoryMap from "@/components/TripMemoryMap";
import TripMoments from "@/components/TripMoments";

type TripSection = "expenses" | "map" | "moments";

export default function TripView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [activeSection, setActiveSection] = useState<TripSection>("expenses");

  // Set initial section from URL params
  useEffect(() => {
    const section = searchParams.get("section") as TripSection;
    if (section && ["expenses", "map", "moments"].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Mock data - in real app, fetch based on ID
  const trip = {
    id,
    name: "Chile",
    location: "Santiago & Valparaíso",
    date: "10-17 Oct 2024",
    days: 8,
    participants: 5,
    image: "/assets/trip-chile.png",
  };

  const sections = [
    {
      id: "expenses" as TripSection,
      name: "Gastos",
      icon: Wallet,
      color: "text-coral",
      bgColor: "bg-coral/20",
      description: "Control financiero",
    },
    {
      id: "map" as TripSection,
      name: "Mapa",
      icon: Map,
      color: "text-blueSnow",
      bgColor: "bg-blueSnow/20",
      description: "Línea de tiempo visual",
    },
    {
      id: "moments" as TripSection,
      name: "Momentos",
      icon: Camera,
      color: "text-greenNature",
      bgColor: "bg-greenNature/20",
      description: "Fotos del viaje",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Contenedor principal con padding top por el header fijo */}
      <div className="pt-16">

        {/* Hero con imagen de portada */}
        <section className="relative px-4 container mx-auto max-w-7xl mb-6">
          <Card className="overflow-hidden rounded-[32px] border-none shadow-hover">
            <div className="relative h-64 md:h-80">
              {/* Imagen de portada */}
              <img
                src={trip.image}
                alt={trip.name}
                className="w-full h-full object-cover"
              />

              {/* Gradiente para legibilidad del texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Contenido sobre la imagen */}
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors self-start"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver al dashboard</span>
                </button>

                <div className="flex items-end justify-between gap-4">
                  <div className="text-white">
                    <h1 className="text-4xl md:text-5xl font-black mb-2">{trip.name}</h1>
                    <p className="text-xl font-semibold mb-1">{trip.location}</p>
                    <p className="text-sm text-white/90">
                      {trip.date} · {trip.days} días · {trip.participants} viajeros
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-2 border-white/30 shadow-soft bg-white/90 backdrop-blur hover:bg-white"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Navigation Pills - Minimalista y clara */}
        <section className="px-4 container mx-auto max-w-7xl mb-8">
          <div className="bg-secondary/30 rounded-[32px] p-2 inline-flex gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center gap-2.5 px-6 py-3 rounded-[28px] transition-all font-semibold text-sm
                    ${isActive
                      ? `bg-card shadow-soft text-foreground`
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? section.color : ""}`} />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section Content con transición suave */}
        <main className="px-4 container mx-auto max-w-7xl pb-12">
          <div className="animate-in fade-in duration-300">
            {activeSection === "expenses" && <TripExpenses />}
            {activeSection === "map" && <TripMemoryMap />}
            {activeSection === "moments" && <TripMoments tripId={parseInt(id)} />}
          </div>
        </main>
      </div>
    </div>
  );
}
