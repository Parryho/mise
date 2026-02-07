import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const touchMap = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

export default function StarRating({ value, onChange, size = "md", disabled = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
            touchMap[size],
            disabled ? "cursor-default" : "cursor-pointer hover:scale-110",
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors",
              star <= value
                ? "fill-[#F37021] text-[#F37021]"
                : "fill-none text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
