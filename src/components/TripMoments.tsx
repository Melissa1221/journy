import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Plus, Download, Heart } from "lucide-react";
import { useState } from "react";

const TripMoments = () => {
  const [selectedMoment, setSelectedMoment] = useState<number | null>(null);

  const moments = [
    {
      id: 1,
      title: "Atardecer en Valparaíso",
      description: "Los colores increíbles del cerro Concepción",
      date: "12 Oct 2024",
      likes: 12,
    },
    {
      id: 2,
      title: "Tour de vinos",
      description: "Degustación en el Valle de Colchagua",
      date: "14 Oct 2024",
      likes: 8,
    },
    {
      id: 3,
      title: "Playa Viña del Mar",
      description: "Día perfecto en la costa",
      date: "16 Oct 2024",
      likes: 15,
    },
    {
      id: 4,
      title: "Santiago de noche",
      description: "Vista desde el Cerro San Cristóbal",
      date: "10 Oct 2024",
      likes: 20,
    },
    {
      id: 5,
      title: "Mercado Central",
      description: "Almuerzo de mariscos frescos",
      date: "11 Oct 2024",
      likes: 6,
    },
    {
      id: 6,
      title: "Cerro Alegre",
      description: "Arte callejero y murales coloridos",
      date: "13 Oct 2024",
      likes: 10,
    },
    {
      id: 7,
      title: "Viñedo al amanecer",
      description: "Primera luz sobre las viñas",
      date: "15 Oct 2024",
      likes: 18,
    },
    {
      id: 8,
      title: "Última cena",
      description: "Despedida en restaurante del puerto",
      date: "17 Oct 2024",
      likes: 14,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Tus Mejores Momentos</h2>
          <p className="text-muted-foreground mt-1">
            Las fotos que definen tu viaje
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" variant="outline">
            <Download className="h-5 w-5 mr-2" />
            Exportar Álbum
          </Button>
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Agregar Foto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-full p-3">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Fotos</p>
              <p className="text-3xl font-bold text-primary">{moments.length}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 rounded-full p-3">
              <Heart className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Likes Totales</p>
              <p className="text-3xl font-bold text-accent-foreground">
                {moments.reduce((sum, m) => sum + m.likes, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-blue-light/20 to-blue-light/30 border-blue-deep/20">
          <div className="flex items-center gap-3">
            <div className="bg-blue-light/40 rounded-full p-3">
              <Download className="h-6 w-6 text-blue-deep" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Días Capturados</p>
              <p className="text-3xl font-bold text-blue-deep">8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Photo Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {moments.map((moment) => (
          <Card
            key={moment.id}
            className="group rounded-2xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-border/50 hover:border-primary/30 hover:scale-105"
            onClick={() => setSelectedMoment(selectedMoment === moment.id ? null : moment.id)}
          >
            {/* Photo Placeholder */}
            <div className="relative h-56 bg-gradient-to-br from-secondary via-accent/10 to-primary/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Icon */}
              <Camera className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform" />

              {/* Likes Badge */}
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 bg-card/90 backdrop-blur rounded-full shadow-lg flex items-center gap-1"
              >
                <Heart className="h-3 w-3 fill-current text-destructive" />
                {moment.likes}
              </Badge>

              {/* Selected Indicator */}
              {selectedMoment === moment.id && (
                <div className="absolute inset-0 ring-4 ring-primary ring-inset" />
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
              <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                {moment.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {moment.description}
              </p>
              <p className="text-xs text-muted-foreground">{moment.date}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Export CTA */}
      <Card className="rounded-2xl shadow-card p-8 bg-gradient-to-br from-primary/5 via-accent/5 to-blue-light/10 border-primary/20">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Guarda tus recuerdos para siempre</h3>
          <p className="text-muted-foreground">
            Exporta tu álbum completo como PDF artístico y compártelo con tus amigos, imprímelo o
            guárdalo como recuerdo digital.
          </p>
          <Button size="lg" className="shadow-lg">
            <Download className="h-5 w-5 mr-2" />
            Exportar Álbum Completo
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TripMoments;
