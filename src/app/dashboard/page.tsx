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
  MessageSquare,
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
    <div className="min-h-screen bg-secondary/30">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Main Content - Padding top to account for fixed header */}
      <main className="pb-20 md:pb-8 md:pt-16">

        {/* EMPTY STATE - Primera vez / Sin viajes activos */}
        {!hasActiveTrip && (
          <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
            >
              {/* Animated Hero Icon */}
              <motion.div
                className="mb-8"
                animate={{
                  y: [0, -25, 0],
                  rotate: [0, 8, -8, 0]
                }}
                transition={{
                  duration: 3.5,
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 18, stiffness: 90, delay: 0.2 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/create-session")}
                  className="cursor-pointer"
                >
                  <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 hover:border-primary/60 transition-all p-6 md:p-8 shadow-lg hover:shadow-2xl">
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 18, stiffness: 90, delay: 0.35 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  className="cursor-pointer"
                >
                  <Card className="bg-gradient-to-br from-greenNature/10 to-blueSnow/10 border-2 border-greenNature/30 hover:border-greenNature/60 transition-all p-6 md:p-8 shadow-lg hover:shadow-2xl">
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
        {/* Hero Card con Foto - Lo primero que ve el usuario */}
        <section className="px-4 pt-6 md:pt-8 md:container md:mx-auto md:max-w-6xl mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 90 }}
          >
            <Card className="overflow-hidden rounded-[32px] border-none shadow-hover">
              {/* Cover Image con info overlay */}
              <div className="relative h-72 md:h-96">
                <Image
                  src={activeTrip.coverImage}
                  alt={activeTrip.name}
                  fill
                  className="object-cover"
                  priority
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                {/* Badge días restantes - Top right */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground border-none px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                    <Clock className="h-4 w-4 mr-1.5 inline" />
                    {activeTrip.daysLeft} días
                  </Badge>
                </div>

                {/* Info del viaje - Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="mb-4">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl">
                      {activeTrip.name}
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-lg">
                      {activeTrip.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-white/90 mb-4">
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{activeTrip.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{activeTrip.startDate} - {activeTrip.endDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{activeTrip.participants.length} viajeros</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-white/90">
                      <span>Día {activeTrip.currentDay} de {activeTrip.totalDays}</span>
                      <span>{Math.round(progressPercent)}% completado</span>
                    </div>
                    <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-primary to-coral h-full rounded-full shadow-[0_0_15px_rgba(255,135,80,0.6)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ type: "spring", damping: 25, stiffness: 80, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* CTA PRINCIPAL - Lo más importante: ir al viaje */}
        <section className="px-4 md:container md:mx-auto md:max-w-6xl mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 90 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/session/${activeTrip.id}`)}
            className="cursor-pointer"
          >
            <Card className="bg-gradient-to-br from-primary/10 via-coral/5 to-background border-none shadow-hover rounded-[32px] p-6 md:p-8 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                        Continuar viaje
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                      Reportar gastos y compartir momentos
                    </h2>
                    <p className="text-muted-foreground">
                      Chatea con IA, reporta gastos, sube fotos y más
                    </p>
                  </div>
                  <ChevronRight className="h-8 w-8 text-primary" />
                </div>

                {/* Participantes online */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {activeTrip.participants.slice(0, 4).map((p, idx) => (
                      <Avatar key={idx} className={`h-8 w-8 ${p.color} border-2 border-card`}>
                        <AvatarFallback className="text-xs font-bold text-white">
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activeTrip.participants.length} viajeros
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Quick Stats Bar - Métricas importantes */}
        <section className="px-4 md:container md:mx-auto md:max-w-6xl mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Resumen del viaje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

            {/* Stat 1 - Total Gastado */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 100, delay: 0.1 }}
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=expenses`)}
              className="cursor-pointer"
            >
              <Card className="bg-gradient-to-br from-coral/20 to-coral/5 border-none p-4 hover:shadow-hover transition-all shadow-soft rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="bg-coral/20 rounded-2xl p-3">
                    <Wallet className="h-6 w-6 text-coral" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total gastado</p>
                    <p className="text-2xl md:text-3xl font-black text-coral truncate">S/{activeTrip.stats.totalSpent}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Stat 2 - Tu Balance */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 100, delay: 0.2 }}
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=expenses`)}
              className="cursor-pointer"
            >
              <Card className={`p-4 hover:shadow-hover transition-all shadow-soft rounded-3xl border-none ${
                activeTrip.stats.yourBalance < 0
                  ? "bg-gradient-to-br from-red-500/20 to-red-500/5"
                  : "bg-gradient-to-br from-greenSuccess/20 to-greenSuccess/5"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${
                    activeTrip.stats.yourBalance < 0 ? "bg-red-500/20" : "bg-greenSuccess/20"
                  }`}>
                    {activeTrip.stats.yourBalance < 0 ? (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    ) : (
                      <TrendingUp className="h-6 w-6 text-greenSuccess" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      {activeTrip.stats.yourBalance < 0 ? "Debes" : "Te deben"}
                    </p>
                    <p className={`text-2xl md:text-3xl font-black truncate ${
                      activeTrip.stats.yourBalance < 0 ? "text-red-500" : "text-greenSuccess"
                    }`}>
                      S/{Math.abs(activeTrip.stats.yourBalance)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Stat 3 - Fotos */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 100, delay: 0.3 }}
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=moments`)}
              className="cursor-pointer"
            >
              <Card className="bg-gradient-to-br from-greenNature/20 to-greenNature/5 border-none p-4 hover:shadow-hover transition-all shadow-soft rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="bg-greenNature/20 rounded-2xl p-3">
                    <Camera className="h-6 w-6 text-greenNature" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Fotos</p>
                    <p className="text-2xl md:text-3xl font-black text-greenNature">{activeTrip.stats.photosCount}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Stat 4 - Lugares */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 100, delay: 0.4 }}
              whileHover={{ scale: 1.08, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=map`)}
              className="cursor-pointer"
            >
              <Card className="bg-gradient-to-br from-blueSnow/20 to-blueSnow/5 border-none p-4 hover:shadow-hover transition-all shadow-soft rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="bg-blueSnow/20 rounded-2xl p-3">
                    <Map className="h-6 w-6 text-blueSnow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Lugares</p>
                    <p className="text-2xl md:text-3xl font-black text-blueSnow">{activeTrip.stats.placesVisited}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>
        </section>

        {/* ACCIONES SECUNDARIAS - Explorar más */}
        <section className="px-4 md:container md:mx-auto md:max-w-6xl mb-12">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">
              Explorar más del viaje
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Ver detalles y recuerdos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Action 2 - Ver Galería */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=moments`)}
              className="cursor-pointer"
            >
              <Card className="bg-card border-none shadow-soft hover:shadow-hover transition-all p-5 rounded-3xl group">
                <div className="flex items-center gap-3">
                  <div className="bg-greenNature/20 rounded-2xl p-3 group-hover:bg-greenNature/30 transition-all">
                    <Camera className="h-6 w-6 text-greenNature" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-greenNature transition-colors">Ver galería</h3>
                    <p className="text-xs text-muted-foreground">{activeTrip.stats.photosCount} fotos</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-greenNature group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </motion.div>

            {/* Action 3 - Ver Mapa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=map`)}
              className="cursor-pointer"
            >
              <Card className="bg-card border-none shadow-soft hover:shadow-hover transition-all p-5 rounded-3xl group">
                <div className="flex items-center gap-3">
                  <div className="bg-blueSnow/20 rounded-2xl p-3 group-hover:bg-blueSnow/30 transition-all">
                    <MapPin className="h-6 w-6 text-blueSnow" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-blueSnow transition-colors">Ver mapa</h3>
                    <p className="text-xs text-muted-foreground">{activeTrip.stats.placesVisited} lugares</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blueSnow group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </motion.div>

            {/* Action 1 - Ver Detalles (nuevo) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/trip/${activeTrip.id}?section=expenses`)}
              className="cursor-pointer"
            >
              <Card className="bg-card border-none shadow-soft hover:shadow-hover transition-all p-5 rounded-3xl group">
                <div className="flex items-center gap-3">
                  <div className="bg-coral/20 rounded-2xl p-3 group-hover:bg-coral/30 transition-all">
                    <Wallet className="h-6 w-6 text-coral" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-coral transition-colors">Ver detalles</h3>
                    <p className="text-xs text-muted-foreground">Gastos y resumen</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-coral group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </motion.div>

          </div>
        </section>

        {/* PAST TRIPS - SECCIÓN SEPARADA */}
        <section className="px-4 md:container md:mx-auto md:max-w-6xl">

          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-foreground">
              Viajes Anteriores
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Revive tus aventuras pasadas
            </p>
          </div>

          {/* Past Trips Grid */}
          <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
            {pastTrips.map((trip, idx) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 85, delay: 1.5 + idx * 0.1 }}
                whileHover={{ scale: 1.04, y: -6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/session/${trip.id}`)}
              >
                <Card className="rounded-3xl overflow-hidden cursor-pointer hover:shadow-hover transition-all border-none shadow-soft">
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
          <div className="mt-8">
            <Button
              size="lg"
              className="w-full md:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft hover:shadow-hover transition-all"
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
          onAddExpense={() => router.push(`/session/${activeTrip.id}`)}
          onAddPhoto={() => router.push(`/trip/${activeTrip.id}?section=moments`)}
          onAddNote={() => router.push(`/session/${activeTrip.id}`)}
        />
      )}
    </div>
  );
}
