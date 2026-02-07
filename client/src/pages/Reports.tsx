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
import jsPDF from "jspdf";
import { format } from "date-fns";

const reportCards = [
  {
    title: "Food-Cost-Analyse",
    description: "Kosten pro Gericht, Woche & Monat mit Kategorie-Aufschlüsselung",
    icon: DollarSign,
    href: "/reports/food-cost",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "PAX-Trends",
    description: "Gästezahlen-Charts, Wochentag-Muster und Saison-Vergleich",
    icon: TrendingUp,
    href: "/reports/pax-trends",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "HACCP-Compliance",
    description: "Lückenanalyse, Temperatur-Trends und Compliance-Prozent",
    icon: Thermometer,
    href: "/reports/haccp-compliance",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Anomalie-Erkennung",
    description: "Automatische Erkennung ungewöhnlicher Temperaturmuster",
    icon: Activity,
    href: "/reports/haccp-anomalies",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    title: "Beliebteste Gerichte",
    description: "Häufigkeitsranking aus Menüplänen und Rotation",
    icon: Star,
    href: "/reports/popular-dishes",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Allergen-Übersicht",
    description: "Tages-Matrix aller Gerichte mit Allergenen und Gast-Warnungen",
    icon: AlertTriangle,
    href: "/reports/allergens",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Buffet-Allergenkarten",
    description: "Druckbare Karten pro Gericht mit Allergen-Kennzeichnung",
    icon: CreditCard,
    href: "/reports/buffet-cards",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "QR-Code Generator",
    description: "QR-Codes für digitale Speisekarten pro Standort",
    icon: QrCode,
    href: "/reports/qr-codes",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  {
    title: "PAX-Prognose",
    description: "KI-gestützte Gästezahlen-Vorhersage für die nächste Woche",
    icon: Brain,
    href: "/reports/pax-forecast",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    title: "Rezept-Vorschläge",
    description: "Saisonale & abwechslungsreiche Rezeptempfehlungen für den Menüplan",
    icon: Sparkles,
    href: "/recipes/suggestions",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    title: "Waste-Prediction",
    description: "Verfallswarnung für geplante Zutaten mit Verwertungsvorschlägen",
    icon: Trash2,
    href: "/reports/waste-prediction",
    color: "text-lime-600",
    bgColor: "bg-lime-50",
  },
];

export default function Reports() {
  const { logs, fridges } = useApp();
  const { toast } = useToast();

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
        const line = `${format(new Date(log.timestamp), "yyyy-MM-dd HH:mm")} | ${log.temperature}°C | ${log.user} | ${log.status}`;
        doc.text(line, 20, y);
        y += 5;
      });

      y += 10;
    });

    doc.save("haccp-report.pdf");
    toast({ title: "Export fertig", description: "HACCP Report wurde heruntergeladen." });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-heading font-bold">Reports & Analysen</h1>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {reportCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`p-2 rounded-lg ${card.bgColor} shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
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
            Schnell-Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportHaccpPDF} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            HACCP-Report als PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
