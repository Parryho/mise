import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

interface Location {
  id: number;
  name: string;
  slug: string;
}

export default function QRGenerator() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const qrRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const getMenuUrl = (slug: string) => {
    const baseUrl = `${window.location.origin}/speisekarte/${slug}`;
    return selectedDate ? `${baseUrl}/${selectedDate}` : baseUrl;
  };

  const downloadQR = async (locationId: number, locationName: string, url: string) => {
    const qrElement = qrRefs.current[locationId];
    if (!qrElement) return;

    const svg = qrElement.querySelector("svg");
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      // Set canvas size (add padding for text)
      const padding = 40;
      const textHeight = 120;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + textHeight;

      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, padding, padding);

      // Add location name
      ctx.fillStyle = "black";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(locationName, canvas.width / 2, img.height + padding + 40);

      // Add URL
      ctx.font = "16px Arial";
      ctx.fillStyle = "#666";
      const urlText = url.length > 60 ? url.substring(0, 57) + "..." : url;
      ctx.fillText(urlText, canvas.width / 2, img.height + padding + 70);

      // Add date if selected
      if (selectedDate) {
        ctx.font = "14px Arial";
        ctx.fillText(
          `Gültig für: ${format(new Date(selectedDate), "dd.MM.yyyy")}`,
          canvas.width / 2,
          img.height + padding + 95
        );
      }

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `qr-${locationName.toLowerCase().replace(/\s+/g, "-")}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintAll = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .qr-card {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 20mm;
          }
        }
      `}</style>

      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-heading font-bold">QR-Code Generator</h1>
          <Button onClick={handlePrintAll} variant="secondary">
            <Printer className="mr-2 h-4 w-4" />
            Alle drucken
          </Button>
        </div>

        <div className="print:hidden">
          <label className="block text-sm font-medium mb-1">
            Datum (optional) — Speisekarte für bestimmtes Datum
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate("")}
              >
                Zurücksetzen
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ohne Datum: QR-Code zeigt immer die aktuelle Tageskarte
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations?.map((location) => {
            const url = getMenuUrl(location.slug);
            return (
              <Card
                key={location.id}
                className="qr-card print:break-inside-avoid"
              >
                <CardHeader>
                  <CardTitle className="text-center">{location.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    ref={(el) => { qrRefs.current[location.id] = el; }}
                    className="flex justify-center bg-white p-4 rounded-md"
                  >
                    <QRCodeSVG
                      value={url}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium break-all">{url}</p>
                    {selectedDate && (
                      <p className="text-xs text-muted-foreground">
                        Gültig für: {format(new Date(selectedDate), "dd.MM.yyyy")}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => downloadQR(location.id, location.name, url)}
                    variant="outline"
                    className="w-full print:hidden"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download als PNG
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {(!locations || locations.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Keine Standorte vorhanden
            </div>
          )}
        </div>

        <div className="print:hidden bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Verwendung:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. QR-Code ausdrucken oder als PNG herunterladen</li>
            <li>2. An Rezeption, Restaurant-Eingang oder Zimmer anbringen</li>
            <li>3. Gäste scannen mit Smartphone → sehen aktuelle Speisekarte</li>
            <li>4. Optional: Datum wählen für Events oder Vorab-Ankündigungen</li>
          </ul>
        </div>
      </div>
    </>
  );
}
