import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  TrendingUp, Thermometer, Star, DollarSign,
  AlertTriangle, CreditCard, QrCode, FileText, Download, Activity,
  Brain, Sparkles, Trash2
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import { format } from "date-fns";

export default function Reports() {
  const { logs, fridges } = useApp();
  const { toast } = useToast();
  const { t } = useTranslation();

  const reportCards = [
    {
      titleKey: "reports.foodCost.title",
      descKey: "reports.foodCost.description",
      icon: DollarSign,
      href: "/reports/food-cost",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      titleKey: "reports.paxTrends.title",
      descKey: "reports.paxTrends.description",
      icon: TrendingUp,
      href: "/reports/pax-trends",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      titleKey: "reports.haccpCompliance.title",
      descKey: "reports.haccpCompliance.description",
      icon: Thermometer,
      href: "/reports/haccp-compliance",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      titleKey: "reports.anomalies.title",
      descKey: "reports.anomalies.description",
      icon: Activity,
      href: "/reports/haccp-anomalies",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      titleKey: "reports.popularDishes.title",
      descKey: "reports.popularDishes.description",
      icon: Star,
      href: "/reports/popular-dishes",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      titleKey: "reports.allergens.title",
      descKey: "reports.allergens.description",
      icon: AlertTriangle,
      href: "/reports/allergens",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      titleKey: "reports.buffetCards.title",
      descKey: "reports.buffetCards.description",
      icon: CreditCard,
      href: "/reports/buffet-cards",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      titleKey: "reports.qrCodes.title",
      descKey: "reports.qrCodes.description",
      icon: QrCode,
      href: "/reports/qr-codes",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      titleKey: "reports.paxForecast.title",
      descKey: "reports.paxForecast.description",
      icon: Brain,
      href: "/reports/pax-forecast",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      titleKey: "reports.recipeSuggestions.title",
      descKey: "reports.recipeSuggestions.description",
      icon: Sparkles,
      href: "/recipes/suggestions",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      titleKey: "reports.wastePrediction.title",
      descKey: "reports.wastePrediction.description",
      icon: Trash2,
      href: "/reports/waste-prediction",
      color: "text-lime-600",
      bgColor: "bg-lime-50",
    },
  ];

  const handleExportHaccpPDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("HACCP Temperature Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 30);

    let y = 40;

    fridges.forEach(fridge => {
      doc.setFont("helvetica", "bold");
      doc.text(`Unit: ${fridge.name}`, 14, y);
      y += 6;

      const fridgeLogs = logs.filter(l => l.fridgeId === fridge.id).slice(0, 10);

      fridgeLogs.forEach(log => {
        doc.setFont("helvetica", "normal");
        const line = `${format(new Date(log.timestamp), "yyyy-MM-dd HH:mm")} | ${log.temperature}\u00b0C | ${log.user} | ${log.status}`;
        doc.text(line, 20, y);
        y += 5;
      });

      y += 10;
    });

    doc.save("haccp-report.pdf");
    toast({ title: t("reports.exportDone"), description: t("reports.haccpReportDownloaded") });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t("reports.title")}</h1>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {reportCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`p-2 rounded-lg ${card.bgColor} shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{t(card.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(card.descKey)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick export section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("reports.quickExport")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportHaccpPDF} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {t("reports.haccpReportPdf")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
