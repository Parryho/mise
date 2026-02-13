import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Image, FileSpreadsheet, File, Filter, Plus, Trash2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest } from "@/lib/queryClient";
import DocumentUploadArea from "@/components/DocumentUploadArea";
import DocumentPreview from "@/components/DocumentPreview";

const CATEGORIES = [
  { id: "rechnungen", icon: "receipt" },
  { id: "lieferscheine", icon: "truck" },
  { id: "haccp", icon: "shield" },
  { id: "rezepte", icon: "chef" },
  { id: "sonstiges", icon: "file" },
] as const;

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

export default function Documents() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("sonstiges");
  const [uploadDescription, setUploadDescription] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  // Fetch documents
  const { data: docs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/documents", filterCategory],
    queryFn: async () => {
      const url = filterCategory !== "all"
        ? `/api/documents?category=${filterCategory}`
        : "/api/documents";
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files, category, description }: { files: File[]; category: string; description: string }) => {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      formData.append("category", category);
      if (description) formData.append("description", description);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload fehlgeschlagen" }));
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setShowUpload(false);
      setUploadDescription("");
      toast({
        title: t("documents.uploadSuccess"),
        description: t("documents.filesUploaded", { count: data.length }),
      });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setPreviewDoc(null);
      toast({ title: t("documents.deleted") });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const handleUpload = useCallback(async (files: File[], category: string) => {
    await uploadMutation.mutateAsync({ files, category, description: uploadDescription });
  }, [uploadMutation, uploadDescription]);

  const handleDelete = useCallback((id: number) => {
    if (confirm(t("documents.confirmDelete"))) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation, t]);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl">{t("documents.title")}</h1>
        <Button onClick={() => setShowUpload(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t("documents.upload")}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            filterCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {t("common.all")}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t(`documents.categories.${cat.id}`)}
          </button>
        ))}
      </div>

      {/* Document List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("common.loading")}</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("documents.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc: any) => {
            const Icon = getFileIcon(doc.mimeType);
            const date = new Date(doc.createdAt).toLocaleDateString("de-AT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            return (
              <Card
                key={doc.id}
                className="press cursor-pointer"
                onClick={() => setPreviewDoc(doc)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(doc.size)} · {date}
                      {doc.uploadedByName && ` · ${doc.uploadedByName}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {t(`documents.categories.${doc.category}`)}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("documents.uploadTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("documents.category")}</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {t(`documents.categories.${cat.id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("documents.description")}</Label>
              <Input
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder={t("documents.descriptionPlaceholder")}
              />
            </div>

            <DocumentUploadArea
              onUpload={handleUpload}
              category={uploadCategory}
              disabled={uploadMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <DocumentPreview
        document={previewDoc}
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
