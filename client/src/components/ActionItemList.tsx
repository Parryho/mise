import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionItem {
  priority: "HIGH" | "MEDIUM" | "LOW";
  source: string;
  title: string;
  detail: string;
  recipeId?: number;
  date?: string;
}

const priorityConfig = {
  HIGH: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", label: "Kritisch" },
  MEDIUM: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", label: "Warnung" },
  LOW: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", label: "Info" },
};

export default function ActionItemList({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        Keine Aktionspunkte — alles in Ordnung!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const config = priorityConfig[item.priority];
        const Icon = config.icon;
        return (
          <div
            key={i}
            className={cn("rounded-lg border p-3 space-y-1", config.bg, config.border)}
          >
            <div className="flex items-start gap-2">
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{item.title}</span>
                  <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                  {item.date && (
                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
