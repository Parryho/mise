import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Play,
  Bot,
  ChevronRight,
  Sparkles,
  History,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocationFilter } from "@/lib/location-context";
import { apiRequest } from "@/lib/queryClient";
import AgentCard, { getAgentLabel, type AgentCardProps } from "@/components/AgentCard";
import ActionItemList, { type ActionItem } from "@/components/ActionItemList";
import { formatLocalDate } from "@shared/constants";

// ── Types ──────────────────────────────────────────────────────────

interface AgentResult {
  agentName: string;
  status: "completed" | "failed" | "skipped";
  durationMs: number;
  confidence: number;
  resultSummary: string;
  data: unknown;
}

interface TeamBriefing {
  runId: number;
  locationSlug: string;
  weekStart: string;
  status: "running" | "completed" | "failed";
  durationMs: number;
  phases: { phase: number; agents: AgentResult[] }[];
  actionItems: ActionItem[];
  summary: string;
  hasAiSummary: boolean;
}

interface SSEEvent {
  type: string;
  phase?: number;
  agent?: string;
  agents?: string[];
  status?: string;
  summary?: string;
  durationMs?: number;
  briefing?: TeamBriefing;
}

interface TeamRun {
  id: number;
  locationSlug: string;
  weekStart: string;
  status: string;
  durationMs: number | null;
  hasAiSummary: boolean;
  summary: string | null;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────

const PHASE_AGENTS: Record<number, string[]> = {
  1: ["pax-forecast", "haccp-anomaly", "waste-prediction"],
  2: ["recipe-suggestions", "allergen-check"],
  3: ["rotation-analysis", "portion-scaling"],
  4: ["ai-synthesis"],
};

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return formatLocalDate(date);
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const kw = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `KW ${kw} (${dateStr})`;
}

// ── Component ──────────────────────────────────────────────────────

export default function AgentTeam() {
  const { toast } = useToast();
  const { locations, selectedSlug } = useLocationFilter();

  const [locationSlug, setLocationSlug] = useState(selectedSlug === "all" ? "city" : selectedSlug);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [briefing, setBriefing] = useState<TeamBriefing | null>(null);
  const [agentStates, setAgentStates] = useState<Record<string, AgentCardProps["status"]>>({});
  const [agentSummaries, setAgentSummaries] = useState<Record<string, string>>({});
  const [agentDurations, setAgentDurations] = useState<Record<string, number>>({});
  const [currentPhase, setCurrentPhase] = useState(0);

  // Fetch past runs
  const { data: pastRuns } = useQuery<TeamRun[]>({
    queryKey: ["/api/agent-team/runs"],
  });

  // Week navigation
  const adjustWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(getMonday(d));
  };

  // SSE listener
  const connectSSE = useCallback((runId: number) => {
    const es = new EventSource(`/api/agent-team/stream/${runId}`, { withCredentials: true });

    es.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);

        switch (event.type) {
          case "phase-start":
            setCurrentPhase(event.phase!);
            for (const agent of event.agents || []) {
              setAgentStates(prev => ({ ...prev, [agent]: "pending" }));
            }
            break;

          case "agent-start":
            setAgentStates(prev => ({ ...prev, [event.agent!]: "running" }));
            break;

          case "agent-complete":
            setAgentStates(prev => ({ ...prev, [event.agent!]: event.status as AgentCardProps["status"] }));
            if (event.summary) setAgentSummaries(prev => ({ ...prev, [event.agent!]: event.summary! }));
            if (event.durationMs) setAgentDurations(prev => ({ ...prev, [event.agent!]: event.durationMs! }));
            break;

          case "briefing-complete":
            setBriefing(event.briefing!);
            setIsRunning(false);
            es.close();
            break;
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      setIsRunning(false);
    };

    return es;
  }, []);

  // Start briefing
  const startBriefing = async () => {
    setIsRunning(true);
    setBriefing(null);
    setAgentStates({});
    setAgentSummaries({});
    setAgentDurations({});
    setCurrentPhase(0);

    try {
      const res = await apiRequest("POST", "/api/agent-team/run", { locationSlug, weekStart });
      const data = await res.json();
      setActiveRunId(data.runId);
      connectSSE(data.runId);
    } catch (err: any) {
      setIsRunning(false);
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  // Load a past run
  const loadRun = async (runId: number) => {
    try {
      const res = await apiRequest("GET", `/api/agent-team/runs/${runId}`, undefined);
      const data = await res.json();
      if (data.briefing) {
        setBriefing(data.briefing);
        setActiveRunId(runId);
        // Set agent states from briefing
        const states: Record<string, AgentCardProps["status"]> = {};
        const summaries: Record<string, string> = {};
        const durations: Record<string, number> = {};
        for (const phase of data.briefing.phases || []) {
          for (const agent of phase.agents || []) {
            states[agent.agentName] = agent.status;
            summaries[agent.agentName] = agent.resultSummary;
            durations[agent.agentName] = agent.durationMs;
          }
        }
        setAgentStates(states);
        setAgentSummaries(summaries);
        setAgentDurations(durations);
        setCurrentPhase(4);
      }
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">Küchen-Team Briefing</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        7 AI-Agents analysieren parallel PAX, HACCP, Waste, Allergene, Rezepte, Rotation und Portionen.
      </p>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Standort</label>
              <Select value={locationSlug} onValueChange={setLocationSlug}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.slug} value={loc.slug}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Woche</label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => adjustWeek(-1)}>&lt;</Button>
                <span className="text-sm font-medium px-2 min-w-[160px] text-center">
                  {formatWeek(weekStart)}
                </span>
                <Button variant="outline" size="sm" onClick={() => adjustWeek(1)}>&gt;</Button>
              </div>
            </div>

            {/* Start */}
            <Button onClick={startBriefing} disabled={isRunning} className="gap-2">
              {isRunning ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Läuft...</>
              ) : (
                <><Play className="h-4 w-4" /> Briefing starten</>
              )}
            </Button>
          </div>

          {/* Past runs */}
          {pastRuns && pastRuns.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Letzte:</span>
              {pastRuns.slice(0, 5).map(run => (
                <Button
                  key={run.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => loadRun(run.id)}
                >
                  #{run.id} {run.locationSlug} {formatWeek(run.weekStart)}
                  {run.status === "completed" && <Badge variant="outline" className="ml-1 text-[9px]">OK</Badge>}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Visualization */}
      {(isRunning || briefing) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agent Pipeline
              {briefing && (
                <Badge variant="outline" className="ml-auto text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {(briefing.durationMs / 1000).toFixed(1)}s
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(phase => {
              const agents = PHASE_AGENTS[phase];
              const isActive = currentPhase >= phase;
              const phaseLabel = phase === 4 ? "AI Synthese" :
                phase === 1 ? "Daten sammeln" :
                phase === 2 ? "Kontext-Analyse" : "Planung";

              if (phase === 4 && !briefing?.hasAiSummary && !isRunning) return null;

              return (
                <div key={phase}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                      Phase {phase}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{phaseLabel}</span>
                    {phase < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {agents.map(agentName => (
                      <AgentCard
                        key={agentName}
                        name={agentName}
                        label={getAgentLabel(agentName)}
                        status={agentStates[agentName] || "pending"}
                        summary={agentSummaries[agentName]}
                        durationMs={agentDurations[agentName]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {briefing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Aktionspunkte
              <Badge variant="outline" className="ml-auto">
                {briefing.actionItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionItemList items={briefing.actionItems} />
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {briefing?.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {briefing.hasAiSummary && <Sparkles className="h-4 w-4 text-primary" />}
              Zusammenfassung
              {briefing.hasAiSummary && (
                <Badge variant="secondary" className="text-[10px]">AI</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{briefing.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
