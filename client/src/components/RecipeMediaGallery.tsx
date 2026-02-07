import { useState, useEffect, useCallback } from "react";
import { Loader2, X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: number;
  recipeId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  caption: string | null;
  step: number | null;
  createdAt: string;
}

interface RecipeMediaGalleryProps {
  recipeId: number;
  steps?: string[];
}

export default function RecipeMediaGallery({ recipeId, steps }: RecipeMediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/recipes/${recipeId}/media`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setMedia(data);
        }
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [recipeId]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = useCallback(() => {
    setLightboxIndex(prev => (prev + 1) % media.length);
  }, [media.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex(prev => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, nextImage, prevImage]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (media.length === 0) {
    return null; // Don't show anything if no media
  }

  const currentMedia = media[lightboxIndex];

  return (
    <>
      <div>
        <h3 className="text-sm font-heading font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          Fotos ({media.length})
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, idx) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-border hover:border-primary/50 transition-colors"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={`/uploads/recipes/${item.filename}`}
                alt={item.caption || item.originalName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {item.step !== null && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Schritt {item.step + 1}
                </div>
              )}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation */}
          {media.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/uploads/recipes/${currentMedia.filename}`}
              alt={currentMedia.caption || currentMedia.originalName}
              className="max-w-full max-h-[75vh] object-contain rounded"
            />
            <div className="mt-3 text-center">
              {currentMedia.caption && (
                <p className="text-white text-sm">{currentMedia.caption}</p>
              )}
              {currentMedia.step !== null && steps && steps[currentMedia.step] && (
                <p className="text-white/60 text-xs mt-1">
                  Schritt {currentMedia.step + 1}: {steps[currentMedia.step]}
                </p>
              )}
              <p className="text-white/40 text-xs mt-1">
                {lightboxIndex + 1} / {media.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
