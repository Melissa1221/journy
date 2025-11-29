"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  Camera,
  Map,
  TrendingDown,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import FloatingActionButton from "@/components/FloatingActionButton";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();

  // DEMO MODE: Set to true for presentations (shows empty state first)
  // Set to false to show active trip directly
  const hasActiveTrip = true; // Change to false for demo from scratch

  // Active trip - EL PROTAGONISTA
  const activeTrip = hasActiveTrip ? {
    id: 1,
    name: "Aventura en Chile",
    subtitle: "Santiago & Valparaíso",
    location: "Chile",
    startDate: "10 Oct",
    endDate: "17 Oct",
    currentDay: 3,
    totalDays: 8,
    daysLeft: 5,
    coverImage: "/assets/trip-chile.png",
    participants: [
      { name: "Tú", initials: "TU", color: "bg-primary" },
      { name: "Los Plátanos", initials: "LP", color: "bg-coral" },
      { name: "María", initials: "MA", color: "bg-greenNature" },
      { name: "Carlos", initials: "CA", color: "bg-blueSnow" },
    ],
    stats: {
      totalSpent: 1250,
      yourShare: 312.50,
      yourBalance: -45,
      photosCount: 47,
      placesVisited: 12,
      momentsCount: 23,
    },
  } : null;

  // Past trips - SECUNDARIOS
  const pastTrips = [
    {
      id: 2,
      name: "Paracas Beach",
      location: "Ica, Perú",
      date: "Nov 2024",
      image: "/assets/trip-paracas.png",
      participants: 6,
      total: 680,
    },
    {
      id: 3,
      name: "Machu Picchu",
      location: "Cusco, Perú",
      date: "Oct 2024",
      image: "/assets/trip-machu-picchu.png",
      participants: 4,
      total: 850,
    },
  ];

  const progressPercent = activeTrip ? (activeTrip.currentDay / activeTrip.totalDays) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-8">

        {/* EMPTY STATE - Primera vez / Sin viajes activos */}
        {!hasActiveTrip && (
          <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Animated Hero Icon */}
              <motion.div
                className="mb-8"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="text-8xl md:text-9xl">✈️</span>
              </motion.div>

              {/* Welcome Message */}
              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">
                ¡Bienvenido a tu hub de aventuras!
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Estás a un paso de viajar sin dramas de dinero.
                <br className="hidden md:block" />
                <span className="text-foreground font-semibold">
                  Crea tu primer viaje y comienza la magia
                </span> ✨
              </p>

              {/* Quick Start Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10 max-w-3xl mx-auto">

                {/* Option 1: Create Trip */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/create-session")}
                  className="cursor-pointer"
                >
                  <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 hover:border-primary/60 transition-all p-6 md:p-8">
                    <div className="text-5xl md:text-6xl mb-4">🚀</div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                      Crear mi viaje
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      Comienza una nueva aventura. Genera un código e invita a tus amigos.
                    </p>
                    <Button className="w-full" size="lg">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Empezar ahora
                    </Button>
                  </Card>
                </motion.div>

                {/* Option 2: Join Trip */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="bg-gradient-to-br from-greenNature/10 to-blueSnow/10 border-2 border-greenNature/30 hover:border-greenNature/60 transition-all p-6 md:p-8">
                    <div className="text-5xl md:text-6xl mb-4">🎉</div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                      Unirme a un viaje
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      ¿Te compartieron un código? Únete a la aventura de tus amigos.
                    </p>
                    <Button variant="outline" className="w-full" size="lg">
                      <Users className="mr-2 h-5 w-5" />
                      Ingresar código
                    </Button>
                  </Card>
                </motion.div>

              </div>

              {/* Features Preview */}
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
                <p className="text-sm text-muted-foreground mb-4">
                  Lo que podrás hacer:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl mb-2">💰</div>
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      Balance automático
                    </p>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">📸</div>
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      Álbum compartido
                    </p>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">🗺️</div>
                    <p className="text-xs md:text-sm font-semibold text-foreground">
                      Mapa de recuerdos
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          </section>
        )}

        {/* ACTIVE TRIP - HERO SECTION */}
        {hasActiveTrip && activeTrip && (
        <>
        <section className="mb-8 md:mb-12">
          {/* Label: Viaje Actual */}
          <div className="px-4 pt-4 md:pt-6 md:container md:mx-auto md:max-w-6xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-primary uppercase tracking-wide">
                Tu Viaje Actual
              </h2>
            </div>
          </div>

          {/* Hero Card - COMPLETAMENTE CLICKEABLE */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push(`/trip/${activeTrip.id}`)}
            className="cursor-pointer"
          >
            <Card className="mx-4 md:mx-auto md:max-w-6xl rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20 hover:border-primary/40 transition-all">

              {/* Cover Image Section */}
              <div className="relative h-56 md:h-80">
                <Image
                  src={activeTrip.coverImage}
                  alt={activeTrip.name}
                  fill
                  className="object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                {/* Days Left Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-xl border-2 border-white/20">
                    <Clock className="h-3 w-3 mr-1 inline" />
                    {activeTrip.daysLeft} días restantes
                  </Badge>
                </div>

                {/* Trip Title - Bottom Left */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
                  <div className="mb-3">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl">
                      {activeTrip.name}
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 font-medium">
                      {activeTrip.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-white/90 mb-4">
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{activeTrip.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {activeTrip.startDate} - {activeTrip.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{activeTrip.participants.length} viajeros</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                      <span>Día {activeTrip.currentDay} de {activeTrip.totalDays}</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-white/20 backdrop-blur rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-primary to-accent h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section - Stats & Participants */}
              <div className="bg-gradient-to-br from-card to-card/50 p-6 md:p-8">

                {/* Participants */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Viajeros
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {activeTrip.participants.length} personas
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeTrip.participants.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-background/50 backdrop-blur px-3 py-2 rounded-full border border-border/50"
                      >
                        <Avatar className={`h-6 w-6 ${p.color} border-2 border-background`}>
                          <AvatarFallback className="text-[10px] font-bold text-white">
                            {p.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  {/* Total Gastado */}
                  <div className="bg-gradient-to-br from-coral/20 to-coral/5 rounded-2xl p-4 border border-coral/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-coral" />
                      <TrendingUp className="h-4 w-4 text-coral" />
                    </div>
                    <p className="text-2xl md:text-3xl font-black text-foreground">
                      S/{activeTrip.stats.totalSpent}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Total gastado
                    </p>
                  </div>

                  {/* Tu Balance */}
                  <div className={`rounded-2xl p-4 border-2 ${
                    activeTrip.stats.yourBalance < 0
                      ? "bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/40"
                      : "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/40"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {activeTrip.stats.yourBalance < 0 ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className={`text-2xl md:text-3xl font-black ${
                      activeTrip.stats.yourBalance < 0 ? "text-red-500" : "text-green-500"
                    }`}>
                      S/{Math.abs(activeTrip.stats.yourBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {activeTrip.stats.yourBalance < 0 ? "Debes" : "Te deben"}
                    </p>
                  </div>

                  {/* Fotos */}
                  <div className="bg-gradient-to-br from-greenNature/20 to-greenNature/5 rounded-2xl p-4 border border-greenNature/30">
                    <Camera className="h-5 w-5 text-greenNature mb-2" />
                    <p className="text-2xl md:text-3xl font-black text-foreground">
                      {activeTrip.stats.photosCount}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Fotos guardadas
                    </p>
                  </div>

                  {/* Lugares */}
                  <div className="bg-gradient-to-br from-blueSnow/20 to-blueSnow/5 rounded-2xl p-4 border border-blueSnow/30">
                    <Map className="h-5 w-5 text-blueSnow mb-2" />
                    <p className="text-2xl md:text-3xl font-black text-foreground">
                      {activeTrip.stats.placesVisited}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Lugares visitados
                    </p>
                  </div>

                </div>

                {/* CTA - Abrir Viaje */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span>Click para ver detalles del viaje</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

              </div>
            </Card>
          </motion.div>
        </section>

        {/* PAST TRIPS - SECCIÓN SEPARADA */}
        <section className="px-4 md:container md:mx-auto md:max-w-6xl">

          {/* Section Header */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-muted-foreground">
              Viajes Anteriores
            </h2>
            <p className="text-sm text-muted-foreground/80">
              Tus aventuras pasadas
            </p>
          </div>

          {/* Past Trips Grid */}
          <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
            {pastTrips.map((trip) => (
              <motion.div
                key={trip.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/trip/${trip.id}`)}
              >
                <Card className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all border border-border/50 hover:border-border">
                  <div className="flex md:flex-col">

                    {/* Image */}
                    <div className="relative w-28 h-28 md:w-full md:h-40 flex-shrink-0">
                      <Image
                        src={trip.image}
                        alt={trip.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4">
                      <h3 className="font-bold text-base mb-1">{trip.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {trip.location}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{trip.date}</span>
                        <span className="font-bold text-sm">S/{trip.total}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Create New Trip Button */}
          <div className="mt-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full md:w-auto rounded-full border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5"
              onClick={() => router.push("/create-session")}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Crear Nuevo Viaje
            </Button>
          </div>

        </section>
        </>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Floating Action Button - Only show if there's an active trip */}
      {hasActiveTrip && activeTrip && (
        <FloatingActionButton
          onAddExpense={() => router.push(`/trip/${activeTrip.id}?section=expenses`)}
          onAddPhoto={() => router.push(`/trip/${activeTrip.id}?section=moments`)}
          onAddNote={() => console.log("Add note")}
        />
      )}
    </div>
  );
}
