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
      name: "Tus gastos",
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Control financiero",
    },
    {
      id: "map" as TripSection,
      name: "Mapa de recuerdos",
      icon: Map,
      color: "text-accent-foreground",
      bgColor: "bg-accent/10",
      description: "Línea de tiempo visual",
    },
    {
      id: "moments" as TripSection,
      name: "Mejores momentos",
      icon: Camera,
      color: "text-blue-deep",
      bgColor: "bg-blue-light/30",
      description: "Fotos del viaje",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Header with Cover */}
      <div className="relative h-64 overflow-hidden">
        <img src={trip.image} alt={trip.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />

        {/* Header Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="bg-card/80 backdrop-blur hover:bg-card"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur hover:bg-card">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur hover:bg-card">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="text-white">
            <h1 className="text-4xl font-bold drop-shadow-lg mb-2">{trip.name}</h1>
            <p className="text-white/90 text-lg drop-shadow">{trip.location}</p>
            <p className="text-white/80 text-sm mt-1 drop-shadow">
              {trip.date} · {trip.days} días · {trip.participants} viajeros
            </p>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 py-4">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${isActive
                      ? `${section.bgColor} scale-105 shadow-md`
                      : "bg-background hover:bg-secondary/50"
                    }`}
                >
                  <div
                    className={`${isActive ? section.bgColor : "bg-secondary"
                      } rounded-full p-3 transition-all`}
                  >
                    <Icon className={`h-6 w-6 ${isActive ? section.color : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {section.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {activeSection === "expenses" && <TripExpenses />}
          {activeSection === "map" && <TripMemoryMap />}
          {activeSection === "moments" && <TripMoments />}
        </div>
      </main>
    </div>
  );
}
