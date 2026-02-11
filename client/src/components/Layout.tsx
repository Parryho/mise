import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { ChefHat, Users, CalendarDays, Thermometer, Dices, Home, ChevronLeft, Settings2, Moon, Sun, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/hooks/useTranslation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, labelKey: "nav.home", href: "/today" },
    { icon: CalendarDays, labelKey: "nav.planning", href: "/rotation" },
    { icon: ChefHat, labelKey: "nav.recipes", href: "/recipes" },
    { icon: Dices, labelKey: "nav.quiz", href: "/quiz" },
    { icon: Thermometer, labelKey: "nav.haccp", href: "/haccp" },
    { icon: Users, labelKey: "nav.staff", href: "/schedule" },
  ];

  const showBackButton = location !== "/today" && location !== "/";
  const isSettings = location.startsWith("/settings");

  const roleLabel = (role: string) => t(`settings.roles.${role}`) || role;

  return (
    <div className="min-h-screen bg-background flex flex-col md:max-w-2xl lg:max-w-5xl md:mx-auto overflow-hidden relative">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-sm border-b border-border/50 flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Profile Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                {t("layout.welcome")} <span className="text-foreground font-medium">{user?.name || t("layout.guest")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              {/* User Info */}
              <div className="p-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.name || t("layout.guest")}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel(user?.role || "guest")}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Language */}
              <div className="p-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("layout.language")}</span>
                <LanguageSwitcher compact />
              </div>

              {/* Theme */}
              <div className="p-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("layout.theme")}</span>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {theme === "dark" ? t("layout.lightMode") : t("layout.darkMode")}
                </button>
              </div>

              <Separator />

              {/* App Settings */}
              <Link href="/settings">
                <button className="w-full p-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted transition-colors">
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {t("layout.appSettings")}
                </button>
              </Link>

              {/* Logout */}
              <button
                onClick={() => logout()}
                className="w-full p-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted text-destructive transition-colors rounded-b-md"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("auth.logout")}
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1">
          <Link href="/settings" className={cn(
            "flex items-center gap-1 p-2 text-sm transition-colors rounded-md",
            isSettings ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            <Settings2 className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-20 safe-area-bottom custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation - Scrollable */}
      <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-card border-t border-border/50 h-[var(--nav-height)] pb-safe z-50 md:w-full md:max-w-2xl lg:max-w-5xl md:mx-auto">
        <div className="flex justify-around h-full">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 h-full flex-1 min-h-[48px]",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium uppercase tracking-wider">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
