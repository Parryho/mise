import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentCardProps {
  name: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  summary?: string;
  confidence?: number;
  durationMs?: number;
}

const AGENT_LABELS: Record<string, string> = {
  "pax-forecast": "PAX Prognose",
  "haccp-anomaly": "HACCP Anomalien",
  "waste-prediction": "Waste Prediction",
  "recipe-suggestions": "Rezeptvorschläge",
  "allergen-check": "Allergen-Check",
  "rotation-analysis": "Rotation Analyse",
  "portion-scaling": "Portionen-Scaling",
  "ai-synthesis": "AI Zusammenfassung",
};

export function getAgentLabel(name: string): string {
  return AGENT_LABELS[name] || name;
}

export default function AgentCard({ name, label, status, summary, confidence, durationMs }: AgentCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300",
      status === "running" && "ring-2 ring-primary/50",
      status === "completed" && "border-green-500/30",
      status === "failed" && "border-red-500/30",
    )}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon status={status} />
            <span className="text-sm font-medium">{label}</span>
          </div>
          {durationMs != null && status !== "pending" && status !== "running" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
        )}

        {confidence != null && confidence > 0 && status === "completed" && (
          <Badge variant="outline" className={cn(
            "text-[10px]",
            confidence >= 80 ? "border-green-500 text-green-700" :
            confidence >= 50 ? "border-yellow-500 text-yellow-700" :
            "border-red-500 text-red-700"
          )}>
            {Math.round(confidence)}% Konfidenz
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: AgentCardProps["status"] }) {
  switch (status) {
    case "pending":
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "skipped":
      return <SkipForward className="h-4 w-4 text-muted-foreground" />;
  }
}
