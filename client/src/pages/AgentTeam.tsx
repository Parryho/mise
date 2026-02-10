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
  FlaskConical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
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

// ── Demo Data ─────────────────────────────────────────────────────

const DEMO_AGENT_DATA: Record<string, { summary: string; durationMs: number; status: "completed" | "failed" }> = {
  "pax-forecast": {
    summary: "Prognose: Mo 58, Di 62, Mi 55, Do 67, Fr 71 Gäste. Freitag +15% wegen Firmenfeier.",
    durationMs: 1240,
    status: "completed",
  },
  "haccp-anomaly": {
    summary: "Kühlhaus 2 zeigte 3x Temperatur über 5°C (max 6.2°C). Tiefkühler OK. 2 Messungen fehlen.",
    durationMs: 890,
    status: "completed",
  },
  "waste-prediction": {
    summary: "Erwarteter Abfall: 8.3kg/Tag. Risiko bei Fisch-Freitag (+2.1kg). Suppen-Überschuss Di/Mi.",
    durationMs: 1560,
    status: "completed",
  },
  "recipe-suggestions": {
    summary: "5 Rezepte vorgeschlagen: Kürbiscremesuppe (Saison), Rindsgulasch, Zander, Kaiserschmarrn, Gemüsestrudel.",
    durationMs: 2100,
    status: "completed",
  },
  "allergen-check": {
    summary: "2 Konflikte: Gast #12 (Gluten) ↔ Mittwoch Palatschinken. Gast #8 (Laktose) ↔ Donnerstag Rahmspinat.",
    durationMs: 680,
    status: "completed",
  },
  "rotation-analysis": {
    summary: "Woche 3 von 6. Keine Wiederholungen zu Vorwoche. Fisch-Tag fehlt. Vegetarisch-Quote: 28% (Ziel: 30%).",
    durationMs: 1820,
    status: "completed",
  },
  "portion-scaling": {
    summary: "Scaling für 58-71 PAX berechnet. Rindsgulasch: 14.2kg Rindfleisch, 3.8kg Zwiebel. Knödel: 142 Stück.",
    durationMs: 950,
    status: "completed",
  },
  "ai-synthesis": {
    summary: "Briefing erstellt mit 6 Aktionspunkten. Gesamtbewertung: Gut (82/100).",
    durationMs: 3200,
    status: "completed",
  },
};

const DEMO_ACTION_ITEMS: ActionItem[] = [
  {
    priority: "HIGH",
    source: "haccp-anomaly",
    title: "Kühlhaus 2 Temperatur prüfen",
    detail: "3x über 5°C in den letzten 24h (max 6.2°C). Techniker kontaktieren oder Thermostat nachstellen.",
    date: "2026-02-09",
  },
  {
    priority: "HIGH",
    source: "allergen-check",
    title: "Gluten-Konflikt Mittwoch",
    detail: "Gast #12 hat Glutenunverträglichkeit — Palatschinken durch glutenfreie Alternative ersetzen.",
    date: "2026-02-12",
  },
  {
    priority: "MEDIUM",
    source: "rotation-analysis",
    title: "Fisch-Tag einplanen",
    detail: "Aktuelle Woche hat keinen Fisch-Tag. Empfehlung: Donnerstag Zanderfilet mit Petersilkartoffeln.",
  },
  {
    priority: "MEDIUM",
    source: "waste-prediction",
    title: "Suppen-Menge reduzieren Di/Mi",
    detail: "Historisch 1.8kg Suppen-Überschuss an Dienstag/Mittwoch. Portionen um 15% reduzieren.",
  },
  {
    priority: "LOW",
    source: "allergen-check",
    title: "Laktose-Alternative Donnerstag",
    detail: "Gast #8 hat Laktoseintoleranz — Rahmspinat durch Blattspinat mit Olivenöl ersetzen.",
    date: "2026-02-13",
  },
  {
    priority: "LOW",
    source: "pax-forecast",
    title: "Freitag Mehrbestellung",
    detail: "Firmenfeier erwartet (+15% Gäste). Fleisch und Beilagen für 71 statt 62 Portionen bestellen.",
    date: "2026-02-14",
  },
];

const DEMO_SUMMARY = `Wochenbriefing KW 7 — Küche City

Gästeaufkommen: 313 Gäste gesamt (Ø 63/Tag), Freitag Spitzentag mit 71 Gästen wegen Firmenfeier.

Kritisch: Kühlhaus 2 zeigt wiederholt erhöhte Temperaturen — sofortige Prüfung erforderlich. Zwei Allergen-Konflikte bei Stammgästen müssen vor Mittwoch gelöst werden.

Menüplanung: Rotation Woche 3 ist solide, aber es fehlt ein Fisch-Tag. Empfehlung: Donnerstag Zanderfilet einsetzen. Vegetarisch-Quote liegt bei 28%, knapp unter dem 30%-Ziel.

Einkauf: Freitag-Mehrbestellung einplanen. Suppen-Mengen Di/Mi reduzieren um Abfall zu vermeiden. Erwarteter Gesamtabfall: 41.5kg (8.3kg/Tag), optimierbar auf ~35kg durch Portionsanpassung.

Gesamtbewertung: 82/100 — Gut, mit 2 kritischen Punkten die bis Mittwoch zu lösen sind.`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Component ──────────────────────────────────────────────────────

export default function AgentTeam() {
  const { t } = useTranslation();
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
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
  };

  // Demo simulation
  const startDemo = async () => {
    setIsRunning(true);
    setBriefing(null);
    setAgentStates({});
    setAgentSummaries({});
    setAgentDurations({});
    setCurrentPhase(0);

    for (const phase of [1, 2, 3, 4]) {
      const agents = PHASE_AGENTS[phase];
      setCurrentPhase(phase);

      // Set all agents in phase to pending
      for (const agent of agents) {
        setAgentStates(prev => ({ ...prev, [agent]: "pending" }));
      }
      await sleep(300);

      // Set all to running
      for (const agent of agents) {
        setAgentStates(prev => ({ ...prev, [agent]: "running" }));
      }

      // Complete agents with staggered timing
      for (const agent of agents) {
        const data = DEMO_AGENT_DATA[agent];
        await sleep(400 + Math.random() * 600);
        setAgentStates(prev => ({ ...prev, [agent]: data.status }));
        setAgentSummaries(prev => ({ ...prev, [agent]: data.summary }));
        setAgentDurations(prev => ({ ...prev, [agent]: data.durationMs }));
      }

      await sleep(200);
    }

    // Show final briefing
    setBriefing({
      runId: 0,
      locationSlug,
      weekStart,
      status: "completed",
      durationMs: 12440,
      phases: Object.entries(PHASE_AGENTS).map(([phase, agents]) => ({
        phase: parseInt(phase),
        agents: agents.map(a => ({
          agentName: a,
          ...DEMO_AGENT_DATA[a],
          confidence: 75 + Math.random() * 20,
          resultSummary: DEMO_AGENT_DATA[a].summary,
          data: null,
        })),
      })),
      actionItems: DEMO_ACTION_ITEMS,
      summary: DEMO_SUMMARY,
      hasAiSummary: true,
    });
    setIsRunning(false);
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
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">{t("agentTeam.title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("agentTeam.subtitle")}
      </p>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t("agentTeam.location")}</label>
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
              <label className="text-xs font-medium text-muted-foreground">{t("agentTeam.week")}</label>
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
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("agentTeam.running")}</>
              ) : (
                <><Play className="h-4 w-4" /> {t("agentTeam.startBriefing")}</>
              )}
            </Button>
            <Button onClick={startDemo} disabled={isRunning} variant="outline" className="gap-2">
              <FlaskConical className="h-4 w-4" /> {t("agentTeam.demo")}
            </Button>
          </div>

          {/* Past runs */}
          {pastRuns && pastRuns.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("agentTeam.recent")}</span>
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
              {t("agentTeam.pipeline")}
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
              const phaseLabel = t(`agentTeam.phaseLabels.${phase}`);

              if (phase === 4 && !briefing?.hasAiSummary && !isRunning) return null;

              return (
                <div key={phase}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                      {t("agentTeam.phase")} {phase}
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
              {t("agentTeam.actionItems")}
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
              {t("agentTeam.summary")}
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
