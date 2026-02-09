import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star, TrendingUp, TrendingDown, Lightbulb, Brain, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import StarRating from "@/components/StarRating";
import { Link } from "wouter";

interface DashboardStats {
  totalRatings: number;
  avgScore: number;
  uniquePairings: number;
  activeRules: number;
  currentEpsilon: number;
  topPairings: PairingEntry[];
  flopPairings: PairingEntry[];
  scoreDistribution: { rating: number; count: number }[];
  ratingsOverTime: { week: string; count: number; avg: number }[];
}

interface PairingEntry {
  mainRecipeId: number;
  mainRecipeName: string;
  sideRecipeId: number;
  sideRecipeName: string;
  pairingType: string;
  weightedScore: number;
  ratingCount: number;
}

interface LearnedRule {
  id: number;
  mainRecipeId: number;
  mainRecipeName: string;
  ruleType: string;
  targetRecipeName: string;
  confidence: number;
  source: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = { main_starch: "Stärke", main_veggie: "Gemüse" };
const RULE_TYPE_LABELS: Record<string, string> = {
  preferred_starch: "Bevorzugte Stärke",
  forbidden_starch: "Verbotene Stärke",
  preferred_veggie: "Bevorzugtes Gemüse",
  general: "Allgemein",
};
const SOURCE_LABELS: Record<string, string> = { feedback: "Feedback", ai: "KI", manual: "Manuell" };

export default function LearningDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rules, setRules] = useState<LearnedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/quiz/dashboard-stats").then(r => r.json()),
      fetch("/api/quiz/learned-rules").then(r => r.json()),
    ])
      .then(([statsData, rulesData]) => {
        setStats(statsData);
        setRules(rulesData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAIAnalysis = async () => {
    setAiRunning(true);
    try {
      const res = await fetch("/api/quiz/ai-validate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: t("learning.aiDone"), description: data.message });
      loadData();
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setAiRunning(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const PairingTable = ({ pairings, showRank }: { pairings: PairingEntry[]; showRank?: boolean }) => (
    <div className="space-y-2">
      {pairings.map((p, i) => (
        <div key={`${p.mainRecipeId}-${p.sideRecipeId}-${p.pairingType}`} className="flex items-center gap-2 text-sm">
          {showRank && <span className="text-muted-foreground w-5 text-right font-mono text-xs">{i + 1}.</span>}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{p.mainRecipeName}</p>
            <p className="text-xs text-muted-foreground truncate">
              + {p.sideRecipeName}
              <Badge variant="outline" className="ml-1 text-[9px] py-0 h-4">
                {TYPE_LABELS[p.pairingType] || p.pairingType}
              </Badge>
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-sm">{p.weightedScore.toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground ml-1">({p.ratingCount}x)</span>
          </div>
        </div>
      ))}
      {pairings.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">{t("learning.noData")}</p>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="gap-1.5 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            Reports
          </Button>
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t("learning.title")}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.totalRatings}</p>
            <p className="text-xs text-muted-foreground">{t("learning.totalRatings")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{t("learning.avgScore")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.uniquePairings}</p>
            <p className="text-xs text-muted-foreground">{t("learning.uniquePairings")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.activeRules}</p>
            <p className="text-xs text-muted-foreground">{t("learning.activeRules")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Epsilon Info */}
      <Card>
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("learning.explorationRate")}</p>
            <p className="text-xs text-muted-foreground">{t("learning.epsilonDesc")}</p>
          </div>
          <Badge variant="outline" className="text-lg font-mono">
            {(stats.currentEpsilon * 100).toFixed(0)}%
          </Badge>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="top">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="top" className="text-xs">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Top 10
          </TabsTrigger>
          <TabsTrigger value="flop" className="text-xs">
            <TrendingDown className="h-3.5 w-3.5 mr-1" />
            Flop 10
          </TabsTrigger>
          <TabsTrigger value="dist" className="text-xs">
            <Star className="h-3.5 w-3.5 mr-1" />
            {t("learning.distribution")}
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">
            <Lightbulb className="h-3.5 w-3.5 mr-1" />
            {t("learning.rules")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("learning.topPairings")}</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topPairings.length > 0 && (
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.topPairings.slice(0, 5).map(p => ({
                        name: `${p.mainRecipeName.slice(0, 12)}...`,
                        score: p.weightedScore,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#F37021" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <PairingTable pairings={stats.topPairings} showRank />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flop" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("learning.flopPairings")}</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.flopPairings.length > 0 && (
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.flopPairings.slice(0, 5).map(p => ({
                        name: `${p.mainRecipeName.slice(0, 12)}...`,
                        score: p.weightedScore,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <PairingTable pairings={stats.flopPairings} showRank />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dist" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("learning.scoreDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F37021" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {stats.ratingsOverTime.length > 0 && (
                <>
                  <h4 className="text-sm font-medium mb-2">{t("learning.ratingsOverTime")}</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.ratingsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => new Date(v).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" })}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                        <Tooltip
                          labelFormatter={(v) => new Date(v).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        />
                        <Bar yAxisId="left" dataKey="count" fill="#F37021" opacity={0.3} />
                        <Line yAxisId="right" type="monotone" dataKey="avg" stroke="#F37021" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("learning.learnedRules")}</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAIAnalysis} disabled={aiRunning}>
                {aiRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Brain className="h-3.5 w-3.5 mr-1" />}
                {t("learning.aiAnalysis")}
              </Button>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("learning.noRules")}</p>
              ) : (
                <div className="space-y-3">
                  {rules.map(rule => (
                    <div key={rule.id} className="border rounded-md p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{rule.mainRecipeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}: {rule.targetRecipeName}
                          </p>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{rule.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant={rule.source === "ai" ? "default" : "outline"} className="text-[9px]">
                            {SOURCE_LABELS[rule.source] || rule.source}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {(rule.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
