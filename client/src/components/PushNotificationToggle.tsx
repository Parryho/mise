import { Bell, BellOff, BellRing, Loader2, AlertTriangle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await subscribe();
      if (success) {
        toast({ title: t("pushNotifications.activated") });
      } else if (permission === "denied") {
        toast({
          title: t("pushNotifications.permissionDeniedToast"),
          description: t("pushNotifications.permissionDeniedDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("pushNotifications.activationFailed"),
          variant: "destructive",
        });
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast({ title: t("pushNotifications.deactivated") });
      }
    }
  };

  const handleTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast({ title: t("pushNotifications.testSent") });
    } else {
      toast({
        title: t("common.error"),
        description: t("pushNotifications.testFailed"),
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
            {t("pushNotifications.title")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("pushNotifications.notSupported")}
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
          {t("pushNotifications.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("pushNotifications.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium text-sm">{t("pushNotifications.label")}</div>
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
                  ? t("pushNotifications.permissionGranted")
                  : permission === "denied"
                    ? t("pushNotifications.permissionDenied")
                    : t("pushNotifications.permissionDefault")}
              </Badge>
              {isSubscribed && (
                <Badge variant="outline" className="text-[10px]">
                  {t("pushNotifications.active")}
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
              {t("pushNotifications.blocked")}
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
            {t("pushNotifications.sendTest")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
