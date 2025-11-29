import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Users } from "lucide-react";
import { useState } from "react";

const TripMemoryMap = () => {
  const [selectedMemory, setSelectedMemory] = useState<number | null>(null);

  const memories = [
    {
      id: 1,
      title: "Llegada a Santiago",
      description: "Primera vista de la ciudad desde el avión",
      date: "10 Oct",
      time: "3:22 PM",
      location: "Aeropuerto SCL",
      people: ["Juan", "María", "Pedro"],
      position: { top: "20%", left: "15%" },
    },
    {
      id: 2,
      title: "Atardecer en Valparaíso",
      description: "Los colores del cerro al atardecer son increíbles",
      date: "12 Oct",
      time: "7:45 PM",
      location: "Cerro Concepción",
      people: ["Ana", "Carlos"],
      position: { top: "45%", left: "35%" },
    },
    {
      id: 3,
      title: "Viñedos del Valle",
      description: "Tour de vinos en el Valle de Colchagua",
      date: "14 Oct",
      time: "11:00 AM",
      location: "Valle de Colchagua",
      people: ["Juan", "María", "Pedro", "Ana", "Carlos"],
      position: { top: "65%", left: "60%" },
    },
    {
      id: 4,
      title: "Playa en la costa",
      description: "Día perfecto en la playa de Viña del Mar",
      date: "16 Oct",
      time: "2:30 PM",
      location: "Viña del Mar",
      people: ["María", "Ana"],
      position: { top: "30%", left: "75%" },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Mapa de Recuerdos</h2>
        <p className="text-muted-foreground mt-1">
          Se genera automáticamente con las fotos que subes en "Mejores Momentos"
        </p>
      </div>

      {/* Map Container */}
      <Card className="rounded-3xl overflow-hidden shadow-xl border-2 border-border/50">
        <div className="relative h-[600px]">
          {/* Map Background */}
          <img
            src="/assets/map-background.png"
            alt="Mapa del tesoro"
            className="w-full h-full object-cover"
          />
          
          {/* Memory Markers */}
          {memories.map((memory, index) => (
            <div
              key={memory.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ top: memory.position.top, left: memory.position.left }}
            >
              {/* Dotted Path (if not first) */}
              {index > 0 && (
                <div className="absolute w-20 h-0.5 border-t-2 border-dashed border-primary/50 -left-20 top-1/2" />
              )}
              
              {/* Marker Button */}
              <button
                onClick={() => setSelectedMemory(selectedMemory === memory.id ? null : memory.id)}
                className={`relative group transition-all duration-300 ${
                  selectedMemory === memory.id ? "scale-125 z-20" : "hover:scale-110"
                }`}
              >
                {/* Pulse Animation */}
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                
                {/* Marker Circle */}
                <div
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    selectedMemory === memory.id
                      ? "bg-primary ring-4 ring-primary/30"
                      : "bg-card border-2 border-primary group-hover:bg-primary"
                  }`}
                >
                  <Camera
                    className={`h-6 w-6 transition-colors ${
                      selectedMemory === memory.id
                        ? "text-primary-foreground"
                        : "text-primary group-hover:text-primary-foreground"
                    }`}
                  />
                </div>

                {/* Badge Number */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                  {index + 1}
                </div>
              </button>

              {/* Memory Card Popup */}
              {selectedMemory === memory.id && (
                <Card className="absolute top-16 left-1/2 transform -translate-x-1/2 w-80 p-4 shadow-2xl border-2 border-primary/20 z-30 animate-scale-in">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-lg">{memory.title}</h4>
                      <p className="text-sm text-muted-foreground">{memory.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{memory.location}</span>
                      </div>
                      <span>·</span>
                      <span>
                        {memory.date} · {memory.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {memory.people.map((person) => (
                          <Badge key={person} variant="secondary" className="rounded-full text-xs">
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Placeholder for Photo */}
                    <div className="bg-secondary rounded-lg h-40 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Foto del recuerdo</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline List */}
      <Card className="rounded-2xl shadow-card p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="bg-primary/20 rounded-full p-2">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          Línea de Tiempo
        </h3>
        <div className="space-y-3">
          {memories.map((memory, index) => (
            <button
              key={memory.id}
              onClick={() => setSelectedMemory(memory.id)}
              className={`w-full text-left p-4 rounded-xl transition-all border ${
                selectedMemory === memory.id
                  ? "bg-primary/10 border-primary/30 shadow-md"
                  : "bg-background border-border hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      selectedMemory === memory.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{memory.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{memory.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>
                      {memory.date} · {memory.time}
                    </span>
                    <span>·</span>
                    <span>{memory.location}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TripMemoryMap;
