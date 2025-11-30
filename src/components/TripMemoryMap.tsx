"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Loader2, Navigation } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getTripPhotos, type Photo } from "@/lib/api/photos";

interface TripMemoryMapProps {
  tripId?: number;
}

const TripMemoryMap = ({ tripId = 1 }: TripMemoryMapProps) => {
  const [selectedMemory, setSelectedMemory] = useState<number | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [tripId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await getTripPhotos(tripId);
      // Sort by creation date
      const sorted = data.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setPhotos(sorted);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString("es", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Generate wavy path between points
  const generateWavyPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      const midX = (current.x + next.x) / 2;
      const controlY = i % 2 === 0 ? 150 : 350; // Alternate wave height

      // Quadratic bezier curve for wavy effect
      path += ` Q ${midX} ${controlY}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Calculate positions for photos along the timeline
  const calculatePhotoPositions = () => {
    if (photos.length === 0) return [];

    const spacing = 350; // Space between photos
    const baseY = 250; // Center Y position

    return photos.map((photo, index) => ({
      photo,
      x: 200 + index * spacing,
      y: baseY + (index % 2 === 0 ? -50 : 50), // Alternate up and down
    }));
  };

  const photoPositions = calculatePhotoPositions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando mapa de recuerdos...</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <Card className="rounded-[32px] shadow-soft p-12 text-center bg-secondary/10 border-none">
        <MapPin className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No hay fotos todavía</h3>
        <p className="text-muted-foreground">
          Sube fotos en la sección "Momentos" para ver tu mapa de recuerdos
        </p>
      </Card>
    );
  }

  const pathPoints = photoPositions.map(p => ({ x: p.x, y: p.y }));
  const wavyPath = generateWavyPath(pathPoints);
  const totalWidth = Math.max(1200, photoPositions[photoPositions.length - 1]?.x + 400 || 1200);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-foreground">Mapa de Recuerdos</h2>
          <p className="text-muted-foreground mt-1">
            Tu viaje en una línea de tiempo · Desplázate horizontalmente
          </p>
        </div>
        {/* Compass decoration */}
        <div className="hidden md:block">
          <Navigation className="h-12 w-12 text-primary/30" style={{ transform: 'rotate(45deg)' }} />
        </div>
      </div>

      {/* Vintage Map Container - Horizontal Scroll */}
      <div className="relative rounded-[32px] overflow-hidden shadow-hover border-4 border-[#8B7355]/30">
        {/* Vintage paper texture background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, transparent 0%, rgba(139, 115, 85, 0.1) 100%),
              radial-gradient(circle at 80% 20%, transparent 0%, rgba(139, 115, 85, 0.08) 100%),
              linear-gradient(90deg, transparent, rgba(139, 115, 85, 0.05))
            `,
          }}
        />

        {/* Scrollable map */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent"
          style={{
            background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 50%, #F0E2CE 100%)',
          }}
        >
          <svg
            width={totalWidth}
            height="500"
            className="min-w-full"
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => {
              if (!scrollContainerRef.current) return;
              const container = scrollContainerRef.current;
              const startX = e.pageX - container.offsetLeft;
              const scrollLeft = container.scrollLeft;

              const handleMouseMove = (e: MouseEvent) => {
                const x = e.pageX - container.offsetLeft;
                const walk = (x - startX) * 2;
                container.scrollLeft = scrollLeft - walk;
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            {/* Wavy path line */}
            <path
              d={wavyPath}
              fill="none"
              stroke="#8B7355"
              strokeWidth="3"
              strokeDasharray="10,5"
              opacity="0.6"
              strokeLinecap="round"
            />

            {/* Photo points on timeline */}
            {photoPositions.map((pos, index) => (
              <g key={pos.photo.id}>
                {/* Vertical line to photo */}
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={pos.x}
                  y2={pos.y < 250 ? pos.y + 50 : pos.y - 50}
                  stroke="#8B7355"
                  strokeWidth="2"
                  strokeDasharray="5,3"
                  opacity="0.4"
                />

                {/* Photo container with vintage frame */}
                <g
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedMemory(selectedMemory === pos.photo.id ? null : pos.photo.id)}
                >
                  {/* Vintage photo frame */}
                  <rect
                    x={pos.x - 60}
                    y={pos.y < 250 ? 30 : 370}
                    width="120"
                    height="120"
                    fill="#FFF"
                    stroke="#8B7355"
                    strokeWidth="4"
                    rx="4"
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                  />

                  {/* Photo clip-path for image */}
                  <clipPath id={`clip-${pos.photo.id}`}>
                    <rect
                      x={pos.x - 55}
                      y={pos.y < 250 ? 35 : 375}
                      width="110"
                      height="110"
                      rx="2"
                    />
                  </clipPath>

                  {/* Actual photo */}
                  <image
                    href={pos.photo.photo_url}
                    x={pos.x - 55}
                    y={pos.y < 250 ? 35 : 375}
                    width="110"
                    height="110"
                    clipPath={`url(#clip-${pos.photo.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />

                  {/* Number badge */}
                  <circle
                    cx={pos.x + 50}
                    cy={pos.y < 250 ? 40 : 380}
                    r="16"
                    fill="#FF8750"
                    stroke="#FFF"
                    strokeWidth="2"
                  />
                  <text
                    x={pos.x + 50}
                    y={pos.y < 250 ? 46 : 386}
                    textAnchor="middle"
                    fill="#FFF"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {index + 1}
                  </text>
                </g>

                {/* Location label */}
                {pos.photo.location_name && (
                  <text
                    x={pos.x}
                    y={pos.y < 250 ? 160 : 350}
                    textAnchor="middle"
                    fill="#6B5744"
                    fontSize="13"
                    fontWeight="600"
                    fontFamily="Nunito, sans-serif"
                    style={{
                      transform: `rotate(${pos.y < 250 ? -8 : 8}deg)`,
                      transformOrigin: `${pos.x}px ${pos.y < 250 ? 160 : 350}px`,
                    }}
                  >
                    {pos.photo.location_name.length > 15
                      ? pos.photo.location_name.slice(0, 15) + "..."
                      : pos.photo.location_name}
                  </text>
                )}

                {/* Date label */}
                <text
                  x={pos.x}
                  y={pos.y < 250 ? 175 : 365}
                  textAnchor="middle"
                  fill="#8B7355"
                  fontSize="11"
                  fontFamily="Nunito, sans-serif"
                  opacity="0.7"
                >
                  {formatDate(pos.photo.created_at)}
                </text>

                {/* Selected popup */}
                {selectedMemory === pos.photo.id && (
                  <g>
                    {/* Popup background */}
                    <rect
                      x={pos.x - 120}
                      y={pos.y < 250 ? 180 : 240}
                      width="240"
                      height="100"
                      fill="#FFF7F0"
                      stroke="#8B7355"
                      strokeWidth="2"
                      rx="8"
                      filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                    />

                    {/* Popup content */}
                    <text
                      x={pos.x}
                      y={pos.y < 250 ? 205 : 265}
                      textAnchor="middle"
                      fill="#2F2F3A"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="Nunito, sans-serif"
                    >
                      {pos.photo.description?.slice(0, 25) || "Foto del viaje"}
                    </text>

                    {pos.photo.location_name && (
                      <>
                        <text
                          x={pos.x - 105}
                          y={pos.y < 250 ? 230 : 290}
                          fill="#8B7355"
                          fontSize="11"
                          fontFamily="Nunito, sans-serif"
                        >
                          📍 {pos.photo.location_name.slice(0, 20)}
                        </text>
                      </>
                    )}

                    <text
                      x={pos.x - 105}
                      y={pos.y < 250 ? 250 : 310}
                      fill="#8B7355"
                      fontSize="10"
                      fontFamily="Nunito, sans-serif"
                      opacity="0.7"
                    >
                      {formatDate(pos.photo.created_at)} · {formatTime(pos.photo.created_at)}
                    </text>
                  </g>
                )}

                {/* Decorative icons at intervals */}
                {index % 3 === 0 && index > 0 && (
                  <text
                    x={pos.x - 150}
                    y={250}
                    fontSize="32"
                    opacity="0.15"
                  >
                    {['🗻', '🏖️', '🏛️', '🌳'][index % 4]}
                  </text>
                )}
              </g>
            ))}

            {/* Start marker */}
            <g>
              <circle cx="100" cy="250" r="30" fill="#6EBF4E" opacity="0.2" />
              <circle cx="100" cy="250" r="20" fill="#6EBF4E" stroke="#FFF" strokeWidth="3" />
              <text x="100" y="257" textAnchor="middle" fill="#FFF" fontSize="20" fontWeight="bold">🏁</text>
            </g>

            {/* End marker */}
            <g>
              <circle
                cx={photoPositions[photoPositions.length - 1]?.x + 100 || 300}
                cy="250"
                r="30"
                fill="#FF8750"
                opacity="0.2"
              />
              <circle
                cx={photoPositions[photoPositions.length - 1]?.x + 100 || 300}
                cy="250"
                r="20"
                fill="#FF8750"
                stroke="#FFF"
                strokeWidth="3"
              />
              <text
                x={photoPositions[photoPositions.length - 1]?.x + 100 || 300}
                y="257"
                textAnchor="middle"
                fill="#FFF"
                fontSize="20"
                fontWeight="bold"
              >
                ⭐
              </text>
            </g>
          </svg>
        </div>

        {/* Vintage border overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[32px]"
          style={{
            boxShadow: 'inset 0 0 40px rgba(139, 115, 85, 0.2)',
          }}
        />
      </div>

      {/* Info hint */}
      <div className="text-center text-sm text-muted-foreground">
        💡 Arrastra horizontalmente o usa el scroll para navegar por tu línea de tiempo
      </div>
    </div>
  );
};

export default TripMemoryMap;
