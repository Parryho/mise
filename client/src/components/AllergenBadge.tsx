import { ALLERGENS } from "@shared/allergens";

interface AllergenBadgeProps {
  codes: string[];
  size?: "sm" | "md";
}

export default function AllergenBadge({ codes, size = "sm" }: AllergenBadgeProps) {
  if (!codes || codes.length === 0) return null;
  const valid = codes.filter(c => c in ALLERGENS);
  if (valid.length === 0) return null;

  return (
    <span
      className={`text-orange-600 font-medium tracking-tight ${size === "sm" ? "text-[10px]" : "text-xs"}`}
      title={valid.map(c => `${c}=${ALLERGENS[c].nameDE}`).join(", ")}
    >
      {valid.join(",")}
    </span>
  );
}
