import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, CheckCircle, XCircle, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  smtp_configured: string;
  email_haccp_alerts: string;
  email_schedule_changes: string;
  email_catering_confirmations: string;
  email_weekly_report: string;
}

const DEFAULT_SETTINGS: EmailSettings = {
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  smtp_configured: "false",
  email_haccp_alerts: "false",
  email_schedule_changes: "false",
  email_catering_confirmations: "false",
  email_weekly_report: "false",
};

export default function EmailSettingsPage() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      setLocation("/settings");
      return;
    }
    fetchSettings();
  }, [isAdmin]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (error) {
      console.error("Failed to fetch email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/email/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast({ title: t("emailSettings.settingsSaved") });
        // Refresh to get updated smtp_configured status
        await fetchSettings();
      } else {
        const data = await res.json();
        toast({ title: t("common.error"), description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: testEmail || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t("emailSettings.testEmailSent"), description: data.messageId === "console-fallback" ? t("emailSettings.testEmailConsole") : `${t("emailSettings.messageId")}: ${data.messageId}` });
      } else {
        toast({ title: t("emailSettings.sendError"), description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const updateSetting = (key: keyof EmailSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConfigured = settings.smtp_configured === "true";

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">{t("emailSettings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("emailSettings.subtitle")}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" /> {t("emailSettings.smtpConnected")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" /> {t("emailSettings.smtpNotConfigured")}
          </Badge>
        )}
      </div>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("emailSettings.smtpServer")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("emailSettings.smtpDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("emailSettings.host")}</Label>
              <Input
                value={settings.smtp_host}
                onChange={(e) => updateSetting("smtp_host", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("emailSettings.port")}</Label>
              <Input
                type="number"
                value={settings.smtp_port}
                onChange={(e) => updateSetting("smtp_port", e.target.value)}
                placeholder="587"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("emailSettings.username")}</Label>
            <Input
              value={settings.smtp_user}
              onChange={(e) => updateSetting("smtp_user", e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("emailSettings.password")}</Label>
            <Input
              type="password"
              value={settings.smtp_pass}
              onChange={(e) => updateSetting("smtp_pass", e.target.value)}
              placeholder={t("emailSettings.passwordPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("emailSettings.senderAddress")}</Label>
            <Input
              value={settings.smtp_from}
              onChange={(e) => updateSetting("smtp_from", e.target.value)}
              placeholder="kuechenchef@mise.at"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {t("emailSettings.saveSettings")}
          </Button>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t("emailSettings.sendTestEmail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t("emailSettings.recipient")}</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={t("emailSettings.recipientPlaceholder")}
            />
          </div>
          <Button onClick={handleTest} disabled={testing} variant="outline" className="w-full gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t("emailSettings.sendTestEmail")}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Toggles */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t("emailSettings.notifications")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("emailSettings.notificationsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{t("emailSettings.haccpAlerts")}</div>
              <div className="text-xs text-muted-foreground">{t("emailSettings.haccpAlertsDesc")}</div>
            </div>
            <Switch
              checked={settings.email_haccp_alerts === "true"}
              onCheckedChange={(checked) => updateSetting("email_haccp_alerts", checked ? "true" : "false")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{t("emailSettings.scheduleChanges")}</div>
              <div className="text-xs text-muted-foreground">{t("emailSettings.scheduleChangesDesc")}</div>
            </div>
            <Switch
              checked={settings.email_schedule_changes === "true"}
              onCheckedChange={(checked) => updateSetting("email_schedule_changes", checked ? "true" : "false")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{t("emailSettings.cateringConfirmations")}</div>
              <div className="text-xs text-muted-foreground">{t("emailSettings.cateringConfirmationsDesc")}</div>
            </div>
            <Switch
              checked={settings.email_catering_confirmations === "true"}
              onCheckedChange={(checked) => updateSetting("email_catering_confirmations", checked ? "true" : "false")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{t("emailSettings.weeklyReport")}</div>
              <div className="text-xs text-muted-foreground">{t("emailSettings.weeklyReportDesc")}</div>
            </div>
            <Switch
              checked={settings.email_weekly_report === "true"}
              onCheckedChange={(checked) => updateSetting("email_weekly_report", checked ? "true" : "false")}
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2" variant="outline">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("emailSettings.saveNotifications")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
