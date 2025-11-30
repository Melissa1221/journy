"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Plus, Download, Heart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTripMilestones, getMilestonePhotos, type Milestone, type Photo } from "@/lib/api/photos";

interface TripMomentsProps {
  tripId: number;
}

const TripMoments = ({ tripId }: TripMomentsProps) => {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    loadMilestones();
  }, [tripId]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const data = await getTripMilestones(tripId);
      setMilestones(data);
    } catch (error) {
      console.error("Failed to load milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneClick = async (milestoneId: number) => {
    if (selectedMilestone === milestoneId) {
      setSelectedMilestone(null);
      setSelectedPhotos([]);
      return;
    }

    setSelectedMilestone(milestoneId);
    setLoadingPhotos(true);
    try {
      const photos = await getMilestonePhotos(milestoneId);
      setSelectedPhotos(photos);
    } catch (error) {
      console.error("Failed to load photos:", error);
      setSelectedPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando momentos...</span>
      </div>
    );
  }

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
          <Button size="lg" onClick={() => router.push(`/session/${tripId}`)}>
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
              <p className="text-3xl font-bold text-primary">
                {milestones.reduce((sum, m) => sum + m.photo_count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-card p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 rounded-full p-3">
              <Camera className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Momentos</p>
              <p className="text-3xl font-bold text-accent-foreground">
                {milestones.length}
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
              <p className="text-sm text-muted-foreground">Lugares Visitados</p>
              <p className="text-3xl font-bold text-blue-deep">
                {milestones.filter(m => m.location).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Milestones Grid */}
      {milestones.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay momentos registrados aún</p>
          <p className="text-sm text-muted-foreground mt-2">
            Sube fotos desde el chat para crear automáticamente momentos del viaje
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {milestones.map((milestone) => (
            <Card
              key={milestone.id}
              className="group rounded-2xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-border/50 hover:border-primary/30 hover:scale-105"
              onClick={() => handleMilestoneClick(milestone.id)}
            >
              {/* Photo Placeholder */}
              <div className="relative h-56 bg-gradient-to-br from-secondary via-accent/10 to-primary/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon */}
                <Camera className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform" />

                {/* Photo Count Badge */}
                <Badge
                  variant="secondary"
                  className="absolute top-3 right-3 bg-card/90 backdrop-blur rounded-full shadow-lg flex items-center gap-1"
                >
                  <Camera className="h-3 w-3" />
                  {milestone.photo_count}
                </Badge>

                {/* Selected Indicator */}
                {selectedMilestone === milestone.id && (
                  <div className="absolute inset-0 ring-4 ring-primary ring-inset" />
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {milestone.name}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {milestone.description || "Sin descripción"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{milestone.location || "Sin ubicación"}</span>
                  <span>{formatDate(milestone.created_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Milestone Photos */}
      {selectedMilestone && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4">
            Fotos de {milestones.find(m => m.id === selectedMilestone)?.name}
          </h3>
          {loadingPhotos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedPhotos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay fotos en este momento</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedPhotos.map((photo) => (
                <Card key={photo.id} className="rounded-xl overflow-hidden">
                  <img
                    src={photo.photo_url}
                    alt={photo.description || "Foto"}
                    className="w-full h-48 object-cover"
                  />
                  {photo.description && (
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {photo.description}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

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
