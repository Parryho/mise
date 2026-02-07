import { Bell, BellOff, BellRing, Loader2, AlertTriangle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

/**
 * Push notification toggle card for the Settings page.
 * Allows users to subscribe/unsubscribe to push notifications.
 * Shows permission status and provides a test notification button.
 */
export function PushNotificationToggle() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await subscribe();
      if (success) {
        toast({ title: "Push-Benachrichtigungen aktiviert" });
      } else if (permission === "denied") {
        toast({
          title: "Berechtigung verweigert",
          description: "Bitte erlauben Sie Benachrichtigungen in den Browser-Einstellungen.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fehler",
          description: "Push-Benachrichtigungen konnten nicht aktiviert werden.",
          variant: "destructive",
        });
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast({ title: "Push-Benachrichtigungen deaktiviert" });
      }
    }
  };

  const handleTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast({ title: "Test-Benachrichtigung gesendet" });
    } else {
      toast({
        title: "Fehler",
        description: "Test-Benachrichtigung konnte nicht gesendet werden.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="opacity-60">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellOff className="h-4 w-4" />
            Push-Benachrichtigungen
          </CardTitle>
          <CardDescription className="text-xs">
            Ihr Browser unterstützt keine Push-Benachrichtigungen.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {isSubscribed ? (
            <BellRing className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          Push-Benachrichtigungen
        </CardTitle>
        <CardDescription className="text-xs">
          Erhalten Sie Benachrichtigungen bei HACCP-Alarmen und Dienstplanänderungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium text-sm">Benachrichtigungen</div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  permission === "granted"
                    ? "default"
                    : permission === "denied"
                      ? "destructive"
                      : "secondary"
                }
                className="text-[10px]"
              >
                {permission === "granted"
                  ? "Erlaubt"
                  : permission === "denied"
                    ? "Blockiert"
                    : "Nicht angefragt"}
              </Badge>
              {isSubscribed && (
                <Badge variant="outline" className="text-[10px]">
                  Aktiv
                </Badge>
              )}
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={permission === "denied"}
            />
          )}
        </div>

        {permission === "denied" && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Benachrichtigungen sind blockiert. Bitte ändern Sie dies in den
              Browser-Einstellungen und laden Sie die Seite neu.
            </span>
          </div>
        )}

        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            className="w-full gap-2"
          >
            <Send className="h-3 w-3" />
            Test-Benachrichtigung senden
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
