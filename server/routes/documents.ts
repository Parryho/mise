import type { Express, Request, Response } from "express";
import express from "express";
import { requireAuth } from "./middleware";
import {
  documentUpload,
  MAX_UPLOAD_FILES,
  handleUploadDocuments,
  handleListDocuments,
  handleGetDocument,
  handleUpdateDocument,
  handleDeleteDocument,
  handleDownloadDocument,
  getDocumentUploadDir,
} from "../modules/documents";

export function registerDocumentRoutes(app: Express) {
  // List documents (optional ?category=xxx filter)
  app.get("/api/documents", requireAuth, handleListDocuments);

  // Get single document metadata
  app.get("/api/documents/:id", requireAuth, handleGetDocument);

  // Upload documents (multipart, up to MAX_UPLOAD_FILES)
  app.post(
    "/api/documents/upload",
    requireAuth,
    documentUpload.array("files", MAX_UPLOAD_FILES),
    handleUploadDocuments
  );

  // Update document metadata (category, description)
  app.put("/api/documents/:id", requireAuth, handleUpdateDocument);

  // Delete document
  app.delete("/api/documents/:id", requireAuth, handleDeleteDocument);

  // Download document file
  app.get("/api/documents/:id/download", requireAuth, handleDownloadDocument);

  // Serve uploaded document files statically
  app.use("/uploads/documents", express.static(getDocumentUploadDir()));
}
