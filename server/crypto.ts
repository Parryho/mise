/**
 * Simple AES-256-GCM encryption for sensitive settings (e.g., SMTP passwords).
 * Uses SESSION_SECRET (or fallback) as key material via PBKDF2.
 */
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const SALT = "mise-settings-encryption";

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET || "dev-insecure-key";
  return crypto.pbkdf2Sync(secret, SALT, 100_000, 32, "sha256");
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decrypt(stored: string): string {
  if (!stored) return "";
  // Not encrypted (legacy plaintext) — return as-is
  if (!stored.startsWith("enc:")) return stored;
  const [, ivB64, tagB64, dataB64] = stored.split(":");
  const key = deriveKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return decipher.update(Buffer.from(dataB64, "base64")) + decipher.final("utf8");
}
