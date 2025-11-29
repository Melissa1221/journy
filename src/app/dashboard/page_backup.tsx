"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Camera, Map, Wallet, TrendingUp, Image as ImageIcon, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import FloatingActionButton from "@/components/FloatingActionButton";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();

  const activeTrip = {
    id: 1,
    name: "Machu Picchu",
    location: "Cusco, Perú",
    date: "15-20 Dic 2024",
    days: 6,
    participants: [
      { name: "Juan", initials: "J", image: null },
      { name: "María", initials: "M", image: null },
      { name: "Carlos", initials: "C", image: null },
      { name: "Ana", initials: "A", image: null },
    ],
    totalExpenses: 450,
    momentsImages: ["/assets/trip-machu-picchu.png", "/assets/trip-machu-picchu.png", "/assets/trip-machu-picchu.png", "/assets/trip-machu-picchu.png"],
    status: "active",
  };

  const trips = [
    {
      id: 1,
      name: "Machu Picchu",
      location: "Cusco, Perú",
      date: "15-20 Dic 2024",
      days: 6,
      participants: [
        { name: "Juan", initials: "J", image: null },
        { name: "María", initials: "M", image: null },
        { name: "Carlos", initials: "C", image: null },
        { name: "Ana", initials: "A", image: null },
      ],
      totalExpenses: 450,
      momentsImages: ["/assets/trip-machu-picchu.png", "/assets/trip-machu-picchu.png", "/assets/trip-machu-picchu.png", "/assets/trip-machu-picchu.png"],
      status: "active",
    },
    {
      id: 2,
      name: "Paracas",
      location: "Ica, Perú",
      date: "1-3 Nov 2024",
      days: 3,
      participants: [
        { name: "Juan", initials: "J", image: null },
        { name: "María", initials: "M", image: null },
        { name: "Pedro", initials: "P", image: null },
        { name: "Laura", initials: "L", image: null },
        { name: "Carlos", initials: "C", image: null },
        { name: "Ana", initials: "A", image: null },
      ],
      totalExpenses: 680,
      momentsImages: ["/assets/trip-paracas.png", "/assets/trip-paracas.png", "/assets/trip-paracas.png"],
      status: "completed",
    },
    {
      id: 3,
      name: "Chile",
      location: "Santiago & Valparaíso",
      date: "10-17 Oct 2024",
      days: 8,
      participants: [
        { name: "Juan", initials: "J", image: null },
        { name: "María", initials: "M", image: null },
        { name: "Carlos", initials: "C", image: null },
        { name: "Ana", initials: "A", image: null },
        { name: "Luis", initials: "L", image: null },
      ],
      totalExpenses: 1200,
      momentsImages: ["/assets/trip-chile.png", "/assets/trip-chile.png", "/assets/trip-chile.png", "/assets/trip-chile.png"],
      status: "completed",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Header - Minimal */}
      <header className="border-b border-border/50 bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">J</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Hola, Juan</h1>
                <p className="text-sm text-muted-foreground">¿Listo para otra aventura?</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/create-session")}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo viaje
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Active Trip - Hero Section */}
          {activeTrip && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">Tu viaje en curso</h2>

              <Card className="rounded-3xl overflow-hidden shadow-soft border-0 bg-card">
                {/* Hero Image with Collage */}
                <div className="relative h-72 overflow-hidden">
                  <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                    {activeTrip.momentsImages.slice(0, 4).map((img, idx) => (
                      <div key={idx} className="relative overflow-hidden">
                        <img
                          src={img}
                          alt={`Momento ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Trip Info Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 space-y-3">
                    <div>
                      <h3 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
                        {activeTrip.name}
                      </h3>
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{activeTrip.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{activeTrip.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>Día 2 de {activeTrip.days}</span>
                        <span>33%</span>
                      </div>
                      <div className="w-full bg-white/20 backdrop-blur rounded-full h-1.5">
                        <div className="bg-white h-full rounded-full" style={{ width: '33%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Participants Avatars - Top Right */}
                  <div className="absolute top-4 right-4 flex -space-x-2">
                    {activeTrip.participants.slice(0, 4).map((participant, idx) => (
                      <Avatar key={idx} className="h-9 w-9 border-2 border-white/50 backdrop-blur">
                        {participant.image ? (
                          <AvatarImage src={participant.image} alt={participant.name} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {participant.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    ))}
                    {activeTrip.participants.length > 4 && (
                      <Avatar className="h-9 w-9 border-2 border-white/50 backdrop-blur">
                        <AvatarFallback className="bg-primary/90 text-primary-foreground text-xs">
                          +{activeTrip.participants.length - 4}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>

                {/* Card Content - Stats and Actions */}
                <div className="p-6 space-y-6">
                  {/* Main Action Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      size="lg"
                      className="w-full text-base h-14 shadow-lg"
                      onClick={() => router.push("/session/demo")}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Aportar al viaje
                    </Button>
                  </motion.div>

                  {/* Mini Statistics */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">S/ {activeTrip.totalExpenses}</p>
                      <p className="text-xs text-muted-foreground mt-1">Gastos totales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">12</p>
                      <p className="text-xs text-muted-foreground mt-1">Recuerdos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-greenNature">Al día</p>
                      <p className="text-xs text-muted-foreground mt-1">Balance</p>
                    </div>
                  </div>

                  {/* Quick Action Chips */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/trip/${activeTrip.id}?section=moments`)}
                      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-greenNature/10 hover:bg-greenNature/20 transition-colors group"
                    >
                      <Camera className="h-5 w-5 text-greenNature" />
                      <span className="text-xs font-medium text-foreground">Añadir momento</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push("/session/demo")}
                      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors group"
                    >
                      <Wallet className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium text-foreground">Registrar gasto</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/trip/${activeTrip.id}?section=map`)}
                      className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-blueSnow/10 hover:bg-blueSnow/20 transition-colors group"
                    >
                      <Map className="h-5 w-5 text-blueSnow" />
                      <span className="text-xs font-medium text-foreground">Ver mapa</span>
                    </motion.button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Modules - Live Folders */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Module 1: Gastos */}
            <Card
              className="rounded-3xl p-6 shadow-soft border-0 bg-card hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => router.push(`/trip/${activeTrip.id}`)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 rounded-2xl p-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-1">Tus gastos</h3>
                  <p className="text-3xl font-bold text-foreground">S/ {activeTrip.totalExpenses}</p>
                  <p className="text-sm text-muted-foreground mt-1">Balance al día ✓</p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/trip/${activeTrip.id}`);
                }}>
                  Ver balance completo
                </Button>
              </div>
            </Card>

            {/* Module 2: Mapa de recuerdos */}
            <Card
              className="rounded-3xl p-6 shadow-soft border-0 bg-card hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => router.push(`/trip/${activeTrip.id}?section=map`)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-blueSnow/20 rounded-2xl p-3">
                    <Map className="h-6 w-6 text-blueSnow" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-1">Mapa de recuerdos</h3>
                  <p className="text-3xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground mt-1">momentos guardados</p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/trip/${activeTrip.id}?section=map`);
                }}>
                  Abrir mapa
                </Button>
              </div>
            </Card>

            {/* Module 3: Mejores momentos */}
            <Card
              className="rounded-3xl p-6 shadow-soft border-0 bg-card hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => router.push(`/trip/${activeTrip.id}?section=moments`)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-greenNature/20 rounded-2xl p-3">
                    <ImageIcon className="h-6 w-6 text-greenNature" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-1">Mejores momentos</h3>
                  <div className="flex gap-1 my-2">
                    {activeTrip.momentsImages.slice(0, 3).map((img, idx) => (
                      <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden">
                        <img src={img} alt={`Momento ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">24 fotos</p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/trip/${activeTrip.id}?section=moments`);
                }}>
                  Ver álbum completo
                </Button>
              </div>
            </Card>
          </div>

          {/* Past Trips - Horizontal Carousel */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">Tus viajes anteriores</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {trips.filter(t => t.status === 'completed').map((trip) => (
              <Card
                key={trip.id}
                className="flex-shrink-0 w-72 rounded-3xl overflow-hidden shadow-soft hover:shadow-lg transition-all cursor-pointer border-0 snap-start"
                onClick={() => router.push(`/trip/${trip.id}`)}
              >
                {/* Cover Image - Collage */}
                <div className="relative h-40 overflow-hidden">
                  <div className="grid grid-cols-2 gap-0.5 h-full">
                    {trip.momentsImages.slice(0, 4).map((img, idx) => (
                      <div key={idx} className="relative overflow-hidden">
                        <img
                          src={img}
                          alt={`${trip.name} momento ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Trip Name Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                      {trip.name}
                    </h3>
                    <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {trip.location}
                    </p>
                  </div>
                </div>

                {/* Trip Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{trip.date}</span>
                    </div>
                    <span>{trip.days} días</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {trip.participants.slice(0, 4).map((participant, idx) => (
                        <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                          {participant.image ? (
                            <AvatarImage src={participant.image} alt={participant.name} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                              {participant.initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {trip.participants.length > 4 && (
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            +{trip.participants.length - 4}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">S/ {trip.totalExpenses}</p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add new trip card */}
            <Card
              className="flex-shrink-0 w-72 rounded-3xl shadow-soft hover:shadow-lg transition-all cursor-pointer border-2 border-dashed border-border hover:border-primary snap-start"
              onClick={() => router.push("/create-session")}
            >
              <div className="h-40 flex items-center justify-center bg-muted/30">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="p-4 text-center">
                <p className="font-semibold text-foreground">Crear nuevo viaje</p>
                <p className="text-xs text-muted-foreground mt-1">Empieza una nueva aventura</p>
              </div>
            </Card>
            </div>
          </div>

          {/* Empty State */}
          {trips.filter(t => t.status === 'completed').length === 0 && (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-bold">Aún no tienes viajes</h3>
                <p className="text-muted-foreground">
                  Comienza a guardar tus aventuras. Cada viaje es una memoria que vale la pena
                  conservar.
                </p>
                <Button size="lg" onClick={() => router.push("/create-session")}>
                  <Plus className="mr-2 h-5 w-5" />
                  Crear tu Primer Viaje
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation - Bottom Bar */}
      <MobileNav />

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddExpense={() => router.push("/session/demo")}
        onAddPhoto={() => console.log("Add photo")}
        onAddNote={() => console.log("Add note")}
      />
    </div>
  );
}
