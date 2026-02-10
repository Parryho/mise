/**
 * Recipe Media (Photo Upload) — Server handlers
 * Uses multer for file upload, local filesystem storage.
 *
 * Docker volume note: Add to docker-compose.prod.yml under 'app' service:
 *   volumes:
 *     - recipe-uploads:/app/uploads/recipes
 * And at top-level volumes:
 *   recipe-uploads:
 */

import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../../db";
import { recipeMedia, recipes, updateRecipeMediaSchema } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

// Upload directory: /app/uploads/recipes in Docker, ./uploads/recipes in dev
const UPLOAD_DIR = process.env.NODE_ENV === "production"
  ? "/app/uploads/recipes"
  : path.join(process.cwd(), "uploads", "recipes");

// Ensure upload directory exists
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error("[recipe-media] Failed to create upload directory:", err);
}

// Allowed MIME types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const recipeId = (req as any).params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const index = Math.floor(Math.random() * 1000);
    cb(null, `${recipeId}_${timestamp}_${index}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Nicht erlaubter Dateityp: ${file.mimetype}. Erlaubt: JPG, PNG, WebP`));
  }
};

export const recipeMediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * POST /api/recipes/:id/media — Upload one or more images
 */
export async function handleUploadMedia(req: Request, res: Response) {
  try {
    const recipeId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Ungueltige Rezept-ID" });
    }

    // Verify recipe exists
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
    if (!recipe) {
      return res.status(404).json({ error: "Rezept nicht gefunden" });
    }

    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Keine Dateien hochgeladen" });
    }

    // Get current max sortOrder
    const existing = await db.select().from(recipeMedia).where(eq(recipeMedia.recipeId, recipeId)).orderBy(asc(recipeMedia.sortOrder));
    let nextOrder = existing.length > 0 ? Math.max(...existing.map(m => m.sortOrder)) + 1 : 0;

    const inserted = [];
    for (const file of files) {
      const [media] = await db.insert(recipeMedia).values({
        recipeId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        sortOrder: nextOrder++,
      }).returning();
      inserted.push(media);
    }

    res.status(201).json(inserted);
  } catch (error: any) {
    console.error("[recipe-media] Upload failed:", error);
    res.status(500).json({ error: error.message || "Upload fehlgeschlagen" });
  }
}

/**
 * GET /api/recipes/:id/media — List media for recipe
 */
export async function handleGetMedia(req: Request, res: Response) {
  try {
    const recipeId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Ungueltige Rezept-ID" });
    }

    const media = await db.select().from(recipeMedia)
      .where(eq(recipeMedia.recipeId, recipeId))
      .orderBy(asc(recipeMedia.sortOrder));

    res.json(media);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * PUT /api/recipes/:id/media/:mediaId — Update caption, sortOrder, step
 */
export async function handleUpdateMedia(req: Request, res: Response) {
  try {
    const recipeId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const mediaId = parseInt(Array.isArray(req.params.mediaId) ? req.params.mediaId[0] : req.params.mediaId, 10);

    if (isNaN(recipeId) || isNaN(mediaId)) {
      return res.status(400).json({ error: "Ungueltige ID" });
    }

    const parsed = updateRecipeMediaSchema.parse(req.body);

    const [updated] = await db.update(recipeMedia)
      .set(parsed)
      .where(eq(recipeMedia.id, mediaId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Medium nicht gefunden" });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * DELETE /api/recipes/:id/media/:mediaId — Delete media file + DB entry
 */
export async function handleDeleteMedia(req: Request, res: Response) {
  try {
    const recipeId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const mediaId = parseInt(Array.isArray(req.params.mediaId) ? req.params.mediaId[0] : req.params.mediaId, 10);

    if (isNaN(recipeId) || isNaN(mediaId)) {
      return res.status(400).json({ error: "Ungueltige ID" });
    }

    // Get the media entry to find the filename
    const [media] = await db.select().from(recipeMedia).where(eq(recipeMedia.id, mediaId));
    if (!media) {
      return res.status(404).json({ error: "Medium nicht gefunden" });
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, media.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn(`[recipe-media] Could not delete file ${filePath}:`, err);
    }

    // Delete DB entry
    await db.delete(recipeMedia).where(eq(recipeMedia.id, mediaId));

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get the upload directory path (for serving static files)
 */
export function getUploadDir(): string {
  return path.resolve(UPLOAD_DIR, "..");
}
