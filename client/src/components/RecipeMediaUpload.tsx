import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, Trash2, GripVertical, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

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

interface RecipeMediaUploadProps {
  recipeId: number;
  steps: string[];
  onMediaChange?: () => void;
}

export default function RecipeMediaUpload({ recipeId, steps, onMediaChange }: RecipeMediaUploadProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
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
  }, [recipeId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const res = await fetch(`/api/recipes/${recipeId}/media`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        toast({ title: t("recipeMedia.uploaded") });
        await fetchMedia();
        onMediaChange?.();
      } else {
        const data = await res.json();
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [recipeId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleDelete = async (mediaId: number) => {
    if (!confirm(t("recipeMedia.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/recipes/${recipeId}/media/${mediaId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: t("recipeMedia.deleted") });
        await fetchMedia();
        onMediaChange?.();
      } else {
        const data = await res.json();
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateCaption = async (mediaId: number, caption: string) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/media/${mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ caption }),
      });
      if (res.ok) {
        setEditingCaption(null);
        await fetchMedia();
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleStepChange = async (mediaId: number, step: number | null) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/media/${mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ step }),
      });
      if (res.ok) {
        await fetchMedia();
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const moveMedia = async (mediaId: number, direction: "up" | "down") => {
    const idx = media.findIndex(m => m.id === mediaId);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= media.length) return;

    // Swap sort orders
    const current = media[idx];
    const target = media[targetIdx];

    try {
      await Promise.all([
        fetch(`/api/recipes/${recipeId}/media/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sortOrder: target.sortOrder }),
        }),
        fetch(`/api/recipes/${recipeId}/media/${target.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
      await fetchMedia();
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">{t("recipeMedia.photos")}</Label>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("recipeMedia.uploading")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("recipeMedia.dropOrClick")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("recipeMedia.fileTypes")}
            </p>
          </div>
        )}
      </div>

      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {media.map((item, idx) => (
            <div key={item.id} className="relative group border rounded-lg overflow-hidden bg-secondary/20">
              <div className="aspect-square relative">
                <img
                  src={`/uploads/recipes/${item.filename}`}
                  alt={item.caption || item.originalName}
                  className="w-full h-full object-cover"
                />
                {/* Overlay controls */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <Button size="icon" variant="secondary" className="h-6 w-6" onClick={() => moveMedia(item.id, "up")}>
                      <GripVertical className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="destructive" className="h-6 w-6" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {item.step !== null && (
                  <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {t("recipeMedia.step")} {item.step + 1}
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1.5">
                {editingCaption === item.id ? (
                  <div className="flex gap-1">
                    <Input
                      value={captionValue}
                      onChange={(e) => setCaptionValue(e.target.value)}
                      className="h-7 text-xs"
                      placeholder={t("recipeMedia.descriptionPlaceholder")}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateCaption(item.id, captionValue);
                        if (e.key === "Escape") setEditingCaption(null);
                      }}
                    />
                    <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleUpdateCaption(item.id, captionValue)}>OK</Button>
                  </div>
                ) : (
                  <p
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground truncate"
                    onClick={() => {
                      setEditingCaption(item.id);
                      setCaptionValue(item.caption || "");
                    }}
                  >
                    {item.caption || t("recipeMedia.addDescription")}
                  </p>
                )}
                <Select
                  value={item.step !== null ? String(item.step) : "none"}
                  onValueChange={(v) => handleStepChange(item.id, v === "none" ? null : parseInt(v, 10))}
                >
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue placeholder={t("recipeMedia.assignStep")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("recipeMedia.noStep")}</SelectItem>
                    {steps.map((step, sIdx) => (
                      <SelectItem key={sIdx} value={String(sIdx)}>
                        {t("recipeMedia.step")} {sIdx + 1}: {step.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && !uploading && (
        <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
          <p className="text-sm">{t("recipeMedia.noPhotos")}</p>
        </div>
      )}
    </div>
  );
}
