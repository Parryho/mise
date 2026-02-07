import { useLocationFilter } from "@/lib/location-context";
import { cn } from "@/lib/utils";

interface LocationSwitcherProps {
  className?: string;
  variant?: "default" | "header"; // header = white/transparent for orange header
}

export default function LocationSwitcher({ className, variant = "default" }: LocationSwitcherProps) {
  const { locations, selectedSlug, setSelectedSlug } = useLocationFilter();

  const options = [
    { slug: "all", label: "Alle" },
    ...locations.map(l => ({ slug: l.slug, label: l.name })),
  ];

  const isHeader = variant === "header";

  return (
    <div className={cn("flex gap-1", className)}>
      {options.map(opt => {
        const isActive = selectedSlug === opt.slug;
        return (
          <button
            key={opt.slug}
            onClick={() => setSelectedSlug(opt.slug)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              isHeader
                ? isActive
                  ? "bg-white text-primary"
                  : "bg-white/20 text-primary-foreground hover:bg-white/30"
                : isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
