import { useState, useCallback, useRef } from "react";
import { Upload, X, FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface DocumentUploadAreaProps {
  onUpload: (files: File[], category: string) => Promise<void>;
  category: string;
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.docx,.doc,.txt,.csv";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 10;

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") return FileSpreadsheet;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadArea({ onUpload, category, disabled }: DocumentUploadAreaProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).slice(0, MAX_FILES);
    setSelectedFiles(prev => [...prev, ...files].slice(0, MAX_FILES));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, MAX_FILES));
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await onUpload(selectedFiles, category);
      setSelectedFiles([]);
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, category, onUpload]);

  const tooLargeFiles = selectedFiles.filter(f => f.size > MAX_FILE_SIZE);

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">{t("documents.dropHere")}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("documents.allowedTypes")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("documents.maxSize", { size: "20MB", count: MAX_FILES })}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, i) => {
            const Icon = getFileIcon(file.type);
            const tooLarge = file.size > MAX_FILE_SIZE;
            return (
              <div key={`${file.name}-${i}`} className={cn(
                "flex items-center gap-2 p-2 rounded-md border",
                tooLarge ? "border-destructive bg-destructive/5" : "border-border"
              )}>
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className={cn("text-xs", tooLarge ? "text-destructive" : "text-muted-foreground")}>
                    {formatSize(file.size)}
                    {tooLarge && ` — ${t("documents.tooLarge")}`}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <Button
            onClick={handleUpload}
            disabled={uploading || tooLargeFiles.length > 0}
            className="w-full"
          >
            {uploading
              ? t("documents.uploading")
              : t("documents.uploadCount", { count: selectedFiles.length })
            }
          </Button>
        </div>
      )}
    </div>
  );
}
