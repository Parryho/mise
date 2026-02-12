/**
 * Zutat-Übersetzung via Claude Haiku (über Claude Code Subagent).
 * Testet Batch-Übersetzung von 50 Zutaten und misst Zeit + Qualität.
 *
 * Usage:
 *   npx tsx script/translate-ingredients-haiku.ts --lang en
 *   npx tsx script/translate-ingredients-haiku.ts --lang en --limit 50
 */

import pkg from "pg";
const { Pool } = pkg;
import Anthropic from "@anthropic-ai/sdk";

const BATCH_SIZE = 50; // Zutaten pro API-Call
const args = process.argv.slice(2);
const langIdx = args.indexOf("--lang");
const lang = langIdx !== -1 ? args[langIdx + 1] : "en";
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 0;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  tr: "Turkish",
  uk: "Ukrainian",
};

async function createPool(): Promise<pkg.Pool> {
  const DB_URL = "postgresql://postgres:CyMmZyDm8LEUTwcNZrkomRjkkNIFkMg@172.18.0.3:5432/mise";
  return new Pool({ connectionString: DB_URL, connectionTimeoutMillis: 3000 });
}

async function main() {
  console.log(`🧠 Haiku Zutat-Übersetzung → ${lang.toUpperCase()}`);
  const startTime = Date.now();

  const pool = await createPool();
  const anthropic = new Anthropic();

  // Offene Zutaten laden
  const allIngredients = await pool.query<{ id: number; name: string }>(
    `SELECT i.id, i.name FROM ingredients i
     WHERE NOT EXISTS (
       SELECT 1 FROM ingredient_translations t
       WHERE t.ingredient_id = i.id AND t.lang = $1
     )
     ORDER BY i.id ${limit > 0 ? `LIMIT ${limit}` : ""}`,
    [lang]
  );

  const pending = allIngredients.rows;
  console.log(`📦 ${pending.length} Zutaten offen\n`);

  let translated = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const names = batch.map(ing => ing.name);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Translate these German cooking ingredient names to ${LANG_NAMES[lang]}. Return ONLY a JSON array of translated strings in the same order. No explanations.

${JSON.stringify(names)}`
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let translatedNames: string[];
    try {
      translatedNames = JSON.parse(text);
    } catch {
      console.error(`  ⚠ JSON parse error, skipping batch at ${i}`);
      console.error(`  Response: ${text.substring(0, 200)}`);
      continue;
    }

    // In DB schreiben
    for (let j = 0; j < batch.length; j++) {
      const translatedName = translatedNames[j] || batch[j].name;
      await pool.query(
        `INSERT INTO ingredient_translations (ingredient_id, lang, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (ingredient_id, lang) DO UPDATE SET name = $3`,
        [batch[j].id, lang, translatedName]
      );
    }

    translated += batch.length;
    const sample = `${names[0]} → ${translatedNames[0]}`;
    console.log(`  ✅ ${translated}/${pending.length} (${sample})`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱ Fertig in ${elapsed}s — ${translated} Zutaten übersetzt`);

  await pool.end();
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
