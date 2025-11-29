"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Users as UsersIcon, Heart, ArrowRight, Clock, Sparkles, CheckCircle2 } from "lucide-react";
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

  const handleCreateSession = () => {
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

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="w-full sm:w-auto" onClick={handleCreateSession}>
                Crear mi viaje ahora
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver demo (2 min)
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

      {/* What We Enable - Positive Approach */}
      <section className="py-16 bg-gradient-to-br from-coral/20 via-background to-salmon/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Libera tu viaje de lo innecesario
              </h2>
              <p className="text-lg text-muted-foreground">
                Concéntrate en vivir. Nosotros nos encargamos del resto.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <StatCard
                stat="100%"
                title="Transparencia"
                description="todos ven lo mismo, en tiempo real"
                icon="✨"
                bgColor="bg-gradient-to-br from-primary/20 to-accent/30"
                delay={0.1}
              />
              <StatCard
                stat="0 min"
                title="Hacer cuentas"
                description="el balance se calcula solo, automáticamente"
                icon="🚀"
                bgColor="bg-gradient-to-br from-greenNature/20 to-accent/20"
                delay={0.2}
              />
              <StatCard
                stat="∞"
                title="Momentos guardados"
                description="fotos, lugares y recuerdos, para siempre"
                icon="❤️"
                bgColor="bg-gradient-to-br from-coral/15 to-salmon/25"
                delay={0.3}
              />
            </div>

            <motion.div
              className="mt-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 md:p-12 text-center border border-primary/20"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Tu acompañante perfecto de principio a fin
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Gastos claros + momentos capturados. Todo lo que necesitas en un solo lugar.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <IconBadge icon="💰" text="Balance automático" />
                <IconBadge icon="📸" text="Álbum de recuerdos" />
                <IconBadge icon="🗺️" text="Mapa interactivo" />
                <IconBadge icon="✅" text="100% transparente" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Simple Flow - 3 Steps */}
      <section className="py-16 bg-gradient-to-br from-bluePastel/15 via-background to-greenNature/15">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Tres pasos para viajar sin dramas de dinero
            </p>
          </motion.div>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            <SimpleStepCard
              number={1}
              icon={<UsersIcon className="h-12 w-12 text-primary" />}
              title="Crea tu sesión"
              description="Invita a tus amigos con un código simple. Todos conectados en tiempo real"
              bgColor="bg-gradient-to-br from-blueSnow/10 to-bluePastel/20"
              delay={0.1}
            />
            <SimpleStepCard
              number={2}
              icon={<DollarSign className="h-12 w-12 text-primary" />}
              title="Registra gastos al instante"
              description="Cada vez que alguien paga algo, lo registra. Balance automático, cero calculadora"
              bgColor="bg-gradient-to-br from-coral/10 to-salmon/20"
              delay={0.2}
            />
            <SimpleStepCard
              number={3}
              icon={<CheckCircle2 className="h-12 w-12 text-primary" />}
              title="Balances claros al final"
              description="Ve quién debe a quién y cuánto. Transparencia total, cero confusión ni peleas"
              bgColor="bg-gradient-to-br from-greenNature/10 to-accent/20"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gradient-to-br from-accent/15 via-background to-coral/15">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Tus recuerdos, siempre contigo
              </h2>
              <p className="text-lg text-muted-foreground">
                Diseñado para preservar tus momentos, donde sea que estés
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <TrustCard
                icon={<Heart className="h-8 w-8 text-coral" />}
                text="Tus fotos, tu privacidad"
                bgColor="bg-gradient-to-br from-coral/20 to-salmon/20"
              />
              <TrustCard
                icon={<Clock className="h-8 w-8 text-blueSnow" />}
                text="Sincronización automática"
                bgColor="bg-gradient-to-br from-blueSnow/20 to-bluePastel/20"
              />
              <TrustCard
                icon={<Sparkles className="h-8 w-8 text-accent" />}
                text="Acceso desde cualquier lugar"
                bgColor="bg-gradient-to-br from-accent/20 to-yellowWarm/20"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            No dejes que tus recuerdos se pierdan
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Cada viaje es único.<br />
            Cada momento merece ser recordado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" onClick={handleCreateSession}>
                Empezar mi viaje
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="lg">
                Ver demo
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border">
        <p className="text-sm">© 2024 TripSplit — Hecha por viajeros, para viajeros.</p>
      </footer>
    </main>
  );
}

const SimpleStepCard = ({ number, icon, title, description, bgColor, delay = 0 }: { number: number; icon: React.ReactNode; title: string; description: string; bgColor: string; delay?: number }) => (
  <motion.div
    className={`${bgColor} rounded-3xl p-8 shadow-card text-center space-y-4 border border-border/30`}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -6, transition: { duration: 0.3 } }}
  >
    <div className="flex justify-center">
      <motion.div
        className="bg-primary/20 rounded-full p-4"
        whileHover={{ rotate: 360, scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
    </div>
    <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold mx-auto shadow-soft">
      {number}
    </div>
    <h3 className="text-lg font-bold text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </motion.div>
);

const StatCard = ({ stat, title, description, icon, bgColor, delay = 0 }: { stat: string; title: string; description: string; icon: string; bgColor: string; delay?: number }) => (
  <motion.div
    className={`${bgColor} rounded-3xl p-8 shadow-card text-center space-y-3 border border-border/30`}
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -4, transition: { duration: 0.3 } }}
  >
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-4xl md:text-5xl font-bold text-primary">{stat}</div>
    <h3 className="text-lg font-bold text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </motion.div>
);

const IconBadge = ({ icon, text }: { icon: string; text: string }) => (
  <motion.div
    className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-full px-5 py-2 flex items-center gap-2 shadow-soft"
    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-medium text-foreground text-sm">{text}</span>
  </motion.div>
);

const TrustCard = ({ icon, text, bgColor }: { icon: React.ReactNode; text: string; bgColor: string }) => (
  <motion.div
    className={`${bgColor} rounded-2xl p-6 shadow-card flex flex-col items-center gap-3 border border-border/30`}
    whileHover={{ y: -4, transition: { duration: 0.3 } }}
  >
    <div className="bg-card/60 backdrop-blur-sm rounded-full p-3">
      {icon}
    </div>
    <p className="text-foreground font-medium text-center">{text}</p>
  </motion.div>
);
