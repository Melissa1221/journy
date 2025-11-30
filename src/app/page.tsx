"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Users as UsersIcon, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function Landing() {
  const [sessionCode, setSessionCode] = useState("");
  const router = useRouter();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const handleAuth = () => {
    router.push("/auth");
  };

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      router.push(`/join/${sessionCode}`);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Image */}
          <motion.div
            className="w-full max-w-3xl mx-auto mb-8 rounded-3xl overflow-hidden shadow-card"
            style={{ y: heroY, opacity: heroOpacity }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src="/assets/travelers-illustration.png"
              alt="Viajeros explorando montañas al atardecer"
              width={1200}
              height={675}
              priority
              className="w-full h-auto object-cover"
            />
          </motion.div>
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Viaja libre. <span className="text-primary">Disfruta cada momento.</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto font-medium">
              Tu compañero perfecto de viaje.<br />
              Gastos claros, <span className="text-primary">recuerdos para siempre.</span><br />
              <span className="text-muted-foreground">Todo en un solo lugar, automáticamente.</span>
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="px-8 py-6 text-lg rounded-full shadow-xl"
                onClick={handleAuth}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Comenzar ahora
              </Button>
            </motion.div>
          </motion.div>

          {/* Join Session */}
          <motion.div
            className="max-w-md mx-auto mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <p className="text-sm text-muted-foreground mb-3">¿Ya tienes un código de sesión?</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ingresa el código..."
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
                className="rounded-full h-12 border-2"
              />
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="secondary" size="icon" onClick={handleJoinSession}>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Pain - Creativo y Visual */}
      <section className="py-12 md:py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Title with emoji decoration */}
            <div className="text-center mb-12 md:mb-16">
              <motion.div
                className="inline-block mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <span className="text-5xl md:text-7xl">😅</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                ¿Te suena familiar?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                El eterno drama de los viajes en grupo
              </p>
            </div>

            {/* Visual Pain Points - Grid creativo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">

              {/* Pain 1 - Excel */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="bg-card border-2 border-coral/30 rounded-3xl p-6 md:p-8 text-center hover:border-coral/60 transition-all group">
                  <div className="relative mb-6">
                    <motion.div
                      className="absolute inset-0 bg-coral/10 rounded-full blur-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <div className="relative text-6xl md:text-7xl mb-4">📊</div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    "¿Quién actualizó el Excel?"
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Archivos compartidos que nadie mantiene al día. Siempre falta alguien.
                  </p>
                  <div className="mt-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                    😤
                  </div>
                </div>
              </motion.div>

              {/* Pain 2 - Confusión */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-card border-2 border-coral/30 rounded-3xl p-6 md:p-8 text-center hover:border-coral/60 transition-all group">
                  <div className="relative mb-6">
                    <motion.div
                      className="absolute inset-0 bg-coral/10 rounded-full blur-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                    <div className="relative text-6xl md:text-7xl mb-4">🤔</div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    "¿Cuánto te debo?"
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Dividir cuentas se vuelve un dolor de cabeza. Nadie sabe quién debe a quién.
                  </p>
                  <div className="mt-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                    🤷‍♂️
                  </div>
                </div>
              </motion.div>

              {/* Pain 3 - Fotos */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="bg-card border-2 border-coral/30 rounded-3xl p-6 md:p-8 text-center hover:border-coral/60 transition-all group">
                  <div className="relative mb-6">
                    <motion.div
                      className="absolute inset-0 bg-coral/10 rounded-full blur-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                    <div className="relative text-6xl md:text-7xl mb-4">📸</div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    "¿Dónde están las fotos?"
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Las mejores fotos perdidas en 5 chats de WhatsApp diferentes.
                  </p>
                  <div className="mt-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                    😔
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Shocking Stats - Impact Section */}
            <motion.div
              className="mt-12 md:mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="text-center mb-8">
                <p className="text-lg md:text-xl text-muted-foreground mb-2">
                  Y no eres el único...
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Los números no mienten
                </h3>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mb-8">

                {/* Stat 1 */}
                <motion.div
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-coral/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-card border-2 border-red-500/30 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl mb-2">💔</div>
                    <div className="text-4xl md:text-6xl font-black text-red-500 mb-2">
                      21-36%
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      de amistades perdidas<br />por problemas de dinero
                    </p>
                  </div>
                </motion.div>

                {/* Stat 2 */}
                <motion.div
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-coral/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-card border-2 border-orange-500/30 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl mb-2">💸</div>
                    <div className="text-4xl md:text-6xl font-black text-orange-500 mb-2">
                      32%
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      del dinero prestado<br />nunca se devuelve
                    </p>
                  </div>
                </motion.div>

                {/* Stat 3 */}
                <motion.div
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-coral/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative bg-card border-2 border-yellow-500/30 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl mb-2">😰</div>
                    <div className="text-4xl md:text-6xl font-black text-yellow-600 mb-2">
                      41%
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      siente tensión al dividir<br />gastos en grupo
                    </p>
                  </div>
                </motion.div>

              </div>

              {/* Bottom message */}
              <div className="text-center">
                <p className="text-xl md:text-3xl font-bold text-coral mb-3">
                  No tiene por qué ser así
                </p>
                <p className="text-base md:text-xl text-muted-foreground">
                  Hay una mejor manera de viajar en grupo
                </p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* The Solution - Creativo y Visual */}
      <section className="py-12 md:py-24 relative overflow-hidden bg-gradient-to-b from-background to-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Title Section */}
            <div className="text-center mb-12 md:mb-16">
              <motion.div
                className="inline-block mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-5xl md:text-7xl">✨</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Todo lo que necesitas,{" "}
                <span className="text-primary">en un solo lugar</span>
              </h2>
              <p className="text-lg md:text-2xl text-muted-foreground font-medium">
                Gastos claros + recuerdos para siempre
              </p>
            </div>

            {/* 3 Main Features - Compactas y elegantes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 max-w-5xl mx-auto">

              {/* Feature 1 - Balance */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
              >
                <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center hover:border-primary/60 transition-all hover:shadow-lg">
                  <motion.div
                    className="inline-block mb-4"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="text-5xl">💰</span>
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                    Balance automático
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Registra gastos al instante.{" "}
                    <span className="text-primary font-semibold">
                      Se calcula solo
                    </span>.
                  </p>
                </div>
              </motion.div>

              {/* Feature 2 - Álbum */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
              >
                <div className="bg-card border border-greenNature/30 rounded-2xl p-6 text-center hover:border-greenNature/60 transition-all hover:shadow-lg">
                  <motion.div
                    className="inline-block mb-4"
                    whileHover={{ scale: 1.15, rotate: -10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="text-5xl">📸</span>
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                    Álbum compartido
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Todas las fotos{" "}
                    <span className="text-greenNature font-semibold">
                      en un lugar
                    </span>, organizadas por fecha.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 - Mapa */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
              >
                <div className="bg-card border border-blueSnow/30 rounded-2xl p-6 text-center hover:border-blueSnow/60 transition-all hover:shadow-lg">
                  <motion.div
                    className="inline-block mb-4"
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="text-5xl">🗺️</span>
                  </motion.div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                    Mapa de recuerdos
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Todos los lugares{" "}
                    <span className="text-blueSnow font-semibold">
                      en un mapa
                    </span>. Tu aventura visual.
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Transparency Badge - Destacado */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl md:rounded-[2rem] blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/30 rounded-3xl md:rounded-[2rem] p-8 md:p-12">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <motion.span
                      className="text-4xl md:text-5xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      ✅
                    </motion.span>
                    <h3 className="text-2xl md:text-4xl font-bold text-foreground">
                      100% transparente, siempre
                    </h3>
                  </div>
                  <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Todos ven lo mismo, en tiempo real.{" "}
                    <span className="text-foreground font-semibold">
                      Cero malentendidos, cero peleas por plata
                    </span>
                    .
                  </p>
                </div>

                {/* Mini badges */}
                <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-background/80 border border-primary/20 rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 shadow-lg"
                  >
                    <span className="text-2xl md:text-3xl">🚫</span>
                    <span className="text-sm md:text-base font-semibold text-foreground">
                      Sin anuncios
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-background/80 border border-primary/20 rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 shadow-lg"
                  >
                    <span className="text-2xl md:text-3xl">🔒</span>
                    <span className="text-sm md:text-base font-semibold text-foreground">
                      Tus datos privados
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-background/80 border border-primary/20 rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 shadow-lg"
                  >
                    <span className="text-2xl md:text-3xl">⚡</span>
                    <span className="text-sm md:text-base font-semibold text-foreground">
                      Sincronización instantánea
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* How It Works - Super Visual */}
      <section className="py-12 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Title */}
            <div className="text-center mb-12 md:mb-20">
              <motion.div
                className="inline-block mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-5xl md:text-7xl">🚀</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Súper simple de usar
              </h2>
              <p className="text-lg md:text-2xl text-muted-foreground">
                Tres pasos y listo. <span className="text-primary font-semibold">Así de fácil</span>.
              </p>
            </div>

            {/* Steps Timeline */}
            <div className="relative max-w-5xl mx-auto">

              {/* Connection line - hidden on mobile */}
              <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

                {/* Step 1 */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="text-center">
                    {/* Number badge */}
                    <motion.div
                      className="relative inline-block mb-6"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                      <div className="relative bg-primary text-primary-foreground rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center font-black text-2xl md:text-3xl shadow-2xl border-4 border-background">
                        1
                      </div>
                    </motion.div>

                    {/* Icon */}
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center bg-primary/10 rounded-3xl p-6">
                        <span className="text-6xl md:text-7xl">👥</span>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                      Crea tu viaje
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      Genera un código único. Compártelo con tus amigos.
                      <span className="text-primary font-semibold"> Todos conectados</span> al instante.
                    </p>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="text-center">
                    {/* Number badge */}
                    <motion.div
                      className="relative inline-block mb-6"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="absolute inset-0 bg-greenNature/20 rounded-full blur-xl" />
                      <div className="relative bg-greenNature text-white rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center font-black text-2xl md:text-3xl shadow-2xl border-4 border-background">
                        2
                      </div>
                    </motion.div>

                    {/* Icon */}
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center bg-greenNature/10 rounded-3xl p-6">
                        <span className="text-6xl md:text-7xl">💸</span>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                      Registra mientras viajas
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      ¿Pagaste algo? Agrégalo en 10 segundos.
                      <span className="text-greenNature font-semibold"> El balance se actualiza solo</span>.
                    </p>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="text-center">
                    {/* Number badge */}
                    <motion.div
                      className="relative inline-block mb-6"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <div className="absolute inset-0 bg-blueSnow/20 rounded-full blur-xl" />
                      <div className="relative bg-blueSnow text-white rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center font-black text-2xl md:text-3xl shadow-2xl border-4 border-background">
                        3
                      </div>
                    </motion.div>

                    {/* Icon */}
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center bg-blueSnow/10 rounded-3xl p-6">
                        <span className="text-6xl md:text-7xl">✅</span>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                      Disfruta sin preocuparte
                    </h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      Al final del viaje, ya sabes exactamente quién debe a quién.
                      <span className="text-blueSnow font-semibold"> Cero drama</span>.
                    </p>
                  </div>
                </motion.div>

              </div>

              {/* Bottom message */}
              <motion.div
                className="text-center mt-12 md:mt-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="inline-block bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-full px-6 md:px-8 py-3 md:py-4">
                  <p className="text-base md:text-lg font-semibold text-foreground">
                    ⚡ Todo en tiempo real. Siempre sincronizado.
                  </p>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Epic */}
      <section className="py-16 md:py-32 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-card/40 to-background" />
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Icon */}
            <motion.div
              className="inline-block mb-8"
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
              <span className="text-7xl md:text-9xl">🌎</span>
            </motion.div>

            {/* Main message */}
            <h2 className="text-3xl md:text-6xl font-black text-foreground mb-6 md:mb-8 leading-tight">
              Tus aventuras merecen<br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                ser vividas sin drama
              </span>
            </h2>

            <p className="text-lg md:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Cada viaje es único. Cada momento cuenta. Cada amistad vale oro.
              <br className="hidden md:block" />
              <span className="text-foreground font-semibold">
                No dejes que el dinero arruine tus recuerdos
              </span>.
            </p>

            {/* CTA Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block mb-8"
            >
              <Button
                size="lg"
                className="px-10 md:px-12 py-6 md:py-8 text-lg md:text-xl rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all"
                onClick={handleAuth}
              >
                <Sparkles className="mr-3 h-6 w-6" />
                Comenzar mi aventura
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </motion.div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm md:text-base text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-greenNature" />
                <span>Gratis para empezar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-greenNature" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-greenNature" />
                <span>Configuración en 2 minutos</span>
              </div>
            </div>

            {/* Social proof hint */}
            <motion.p
              className="mt-8 text-sm md:text-base text-muted-foreground/80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              Únete a miles de viajeros que ya viajan sin dramas 🎉
            </motion.p>

          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border">
        <p className="text-sm">© 2024 Journi — Hecha por viajeros, para viajeros.</p>
      </footer>
    </main>
  );
}


