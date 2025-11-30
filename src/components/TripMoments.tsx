"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Plus, Download, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTripPhotos, uploadPhotos, type Photo } from "@/lib/api/photos";
import { useAuth } from "@/contexts/AuthContext";

interface TripMomentsProps {
  tripId: number;
}

const TripMoments = ({ tripId }: TripMomentsProps) => {
  const router = useRouter();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    loadPhotos();
  }, [tripId]);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        handleFilesSelected(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectedFiles]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const photos = await getTripPhotos(tripId);
      setAllPhotos(photos);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesSelected = useCallback((files: File[]) => {
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  }, [selectedFiles, previewUrls]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    // Revoke the removed URL
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      await uploadPhotos({
        tripId,
        photos: selectedFiles,
        accessToken: session?.access_token,
      });

      // Clear selection
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);

      // Reload photos
      await loadPhotos();
    } catch (error) {
      console.error("Failed to upload photos:", error);
      alert("Error al subir las fotos. Por favor intenta de nuevo.");
    } finally {
      setUploading(false);
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground">Tus Mejores Momentos</h2>
          <p className="text-muted-foreground mt-1">
            Las fotos que definen tu viaje · Pega (Ctrl+V) o selecciona fotos
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" variant="outline" className="rounded-full shadow-soft">
            <Download className="h-5 w-5 mr-2" />
            Exportar Álbum
          </Button>
          <Button
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full shadow-soft"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Fotos
          </Button>
        </div>
      </div>

      {/* Upload Preview */}
      {selectedFiles.length > 0 && (
        <Card className="bg-primary/5 border-primary/20 rounded-[32px] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Revisa y confirma para subir
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  previewUrls.forEach(url => URL.revokeObjectURL(url));
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                }}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Fotos
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] shadow-soft p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-none">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-full p-3">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Fotos</p>
              <p className="text-3xl font-black text-primary">
                {allPhotos.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[32px] shadow-soft p-6 bg-gradient-to-br from-greenNature/5 to-greenNature/10 border-none">
          <div className="flex items-center gap-3">
            <div className="bg-greenNature/20 rounded-full p-3">
              <ImageIcon className="h-6 w-6 text-greenNature" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recuerdos</p>
              <p className="text-3xl font-black text-greenNature">
                {allPhotos.filter(p => p.location_name).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[32px] shadow-soft p-6 bg-gradient-to-br from-blueSnow/20 to-blueSnow/30 border-none">
          <div className="flex items-center gap-3">
            <div className="bg-blueSnow/40 rounded-full p-3">
              <Download className="h-6 w-6 text-blueSnow" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ubicaciones</p>
              <p className="text-3xl font-black text-blueSnow">
                {new Set(allPhotos.filter(p => p.location_name).map(p => p.location_name)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Photos Gallery */}
      {allPhotos.length === 0 ? (
        <Card className="rounded-[32px] shadow-soft p-12 text-center bg-secondary/10 border-none">
          <Camera className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No hay fotos todavía</h3>
          <p className="text-muted-foreground mb-6">
            Sube tus primeras fotos para empezar a crear tu álbum de viaje
          </p>
          <Button
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full shadow-soft"
          >
            <Plus className="h-5 w-5 mr-2" />
            Subir Fotos
          </Button>
        </Card>
      ) : (
        <div>
          <h3 className="text-2xl font-black mb-4">Galería de Fotos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="group rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 cursor-pointer border-none hover:scale-105"
              >
                <div className="relative aspect-square">
                  <img
                    src={photo.photo_url}
                    alt={photo.description || "Foto"}
                    className="w-full h-full object-cover"
                  />
                  {photo.location_name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-xs font-semibold truncate">
                        {photo.location_name}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Export CTA */}
      {allPhotos.length > 0 && (
        <Card className="rounded-[32px] shadow-soft p-8 bg-gradient-to-br from-primary/5 via-greenNature/5 to-blueSnow/10 border-none">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black">Guarda tus recuerdos para siempre</h3>
            <p className="text-muted-foreground">
              Exporta tu álbum completo como PDF artístico y compártelo con tus amigos, imprímelo o
              guárdalo como recuerdo digital.
            </p>
            <Button size="lg" className="rounded-full shadow-soft">
              <Download className="h-5 w-5 mr-2" />
              Exportar Álbum Completo
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TripMoments;
