import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, FileSpreadsheet, File, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface DocumentPreviewProps {
  document: {
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: string;
    description: string | null;
    uploadedByName: string | null;
    createdAt: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") return FileSpreadsheet;
  return File;
}

export default function DocumentPreview({ document: doc, open, onClose, onDelete }: DocumentPreviewProps) {
  const { t } = useTranslation();

  if (!doc) return null;

  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";
  const Icon = getFileIcon(doc.mimeType);
  const fileUrl = `/uploads/documents/${doc.filename}`;
  const downloadUrl = `/api/documents/${doc.id}/download`;
  const date = new Date(doc.createdAt).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="truncate">{doc.originalName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Preview Area */}
        <div className="rounded-md border bg-muted/30 overflow-hidden">
          {isImage ? (
            <img
              src={fileUrl}
              alt={doc.originalName}
              className="w-full max-h-[400px] object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={doc.originalName}
              className="w-full h-[400px]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icon className="h-12 w-12 mb-2" />
              <p className="text-sm">{t("documents.noPreview")}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{formatSize(doc.size)} · {doc.mimeType}</p>
          {doc.description && <p>{doc.description}</p>}
          <p>{t("documents.uploadedBy", { name: doc.uploadedByName || "?" })} · {date}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <a href={downloadUrl} download>
              <Download className="h-4 w-4 mr-2" />
              {t("documents.download")}
            </a>
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(doc.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
