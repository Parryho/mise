/**
 * Document Upload Module — Server handlers
 * Uses multer for file upload, local filesystem storage.
 *
 * Docker volume note: Add to docker-compose.prod.yml under 'app' service:
 *   volumes:
 *     - document-uploads:/app/uploads/documents
 * And at top-level volumes:
 *   document-uploads:
 */

import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { db } from "../../db";
import { documents, updateDocumentSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
const JPEG_QUALITY = 82;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Upload directory: /app/uploads/documents in Docker, ./uploads/documents in dev
const UPLOAD_DIR = process.env.NODE_ENV === "production"
  ? "/app/uploads/documents"
  : path.join(process.cwd(), "uploads", "documents");

// Ensure upload directory exists
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error("[documents] Failed to create upload directory:", err);
}

// Allowed MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",    // .xlsx
  "application/vnd.ms-excel",                                              // .xls
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword",                                                     // .doc
  "text/plain",
  "text/csv",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 10;

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    const ext = path.extname(file.originalname).toLowerCase() || "";
    cb(null, `doc_${timestamp}_${rand}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Nicht erlaubter Dateityp: ${file.mimetype}. Erlaubt: JPG, PNG, WebP, PDF, Excel, Word, TXT, CSV`));
  }
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const MAX_UPLOAD_FILES = MAX_FILES;

/** Resize uploaded image in-place if it exceeds max dimensions */
async function optimizeDocImage(file: Express.Multer.File): Promise<number> {
  const filePath = path.join(UPLOAD_DIR, file.filename);
  try {
    const metadata = await sharp(filePath).metadata();
    if ((!metadata.width || metadata.width <= MAX_IMAGE_WIDTH) &&
        (!metadata.height || metadata.height <= MAX_IMAGE_HEIGHT)) {
      return file.size;
    }
    const buffer = await sharp(filePath)
      .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(filePath, buffer);
    console.log(`[documents] Resized ${file.originalname}: ${metadata.width}x${metadata.height} → ${buffer.length} bytes`);
    return buffer.length;
  } catch (err) {
    console.warn(`[documents] Could not optimize ${file.filename}:`, err);
    return file.size;
  }
}

/**
 * POST /api/documents/upload — Upload one or more files
 */
export async function handleUploadDocuments(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const category = req.body.category || "sonstiges";
    const description = req.body.description || null;

    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Keine Dateien hochgeladen" });
    }

    const inserted = [];
    for (const file of files) {
      // Resize large images (skip non-image files)
      let finalSize = file.size;
      if (IMAGE_TYPES.includes(file.mimetype)) {
        finalSize = await optimizeDocImage(file);
      }

      const [doc] = await db.insert(documents).values({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: finalSize,
        category,
        description,
        uploadedBy: user?.id || null,
        uploadedByName: user?.name || null,
      }).returning();
      inserted.push(doc);
    }

    res.status(201).json(inserted);
  } catch (error: any) {
    console.error("[documents] Upload failed:", error);
    res.status(500).json({ error: error.message || "Upload fehlgeschlagen" });
  }
}

/**
 * GET /api/documents — List all documents (optional category filter)
 */
export async function handleListDocuments(req: Request, res: Response) {
  try {
    const category = req.query.category as string | undefined;

    let query = db.select().from(documents).orderBy(desc(documents.createdAt));
    if (category) {
      query = query.where(eq(documents.category, category)) as any;
    }

    const docs = await query;
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/documents/:id — Get single document metadata
 */
export async function handleGetDocument(req: Request, res: Response) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Ungueltige ID" });

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) return res.status(404).json({ error: "Dokument nicht gefunden" });

    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/documents/:id — Update category/description
 */
export async function handleUpdateDocument(req: Request, res: Response) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Ungueltige ID" });

    const parsed = updateDocumentSchema.parse(req.body);

    const [updated] = await db.update(documents)
      .set(parsed)
      .where(eq(documents.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Dokument nicht gefunden" });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * DELETE /api/documents/:id — Delete document file + DB entry
 */
export async function handleDeleteDocument(req: Request, res: Response) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Ungueltige ID" });

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) return res.status(404).json({ error: "Dokument nicht gefunden" });

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn(`[documents] Could not delete file ${filePath}:`, err);
    }

    // Delete DB entry
    await db.delete(documents).where(eq(documents.id, id));
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/documents/:id/download — Download file
 */
export async function handleDownloadDocument(req: Request, res: Response) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Ungueltige ID" });

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) return res.status(404).json({ error: "Dokument nicht gefunden" });

    const filePath = path.join(UPLOAD_DIR, doc.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Datei nicht gefunden" });
    }

    res.download(filePath, doc.originalName);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get the upload directory path (for serving static files)
 */
export function getDocumentUploadDir(): string {
  return UPLOAD_DIR;
}
