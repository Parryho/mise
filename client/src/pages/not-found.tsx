import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
          <Link href="/today">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zur Startseite
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
