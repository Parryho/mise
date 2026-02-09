import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { ChefHat, Users, CalendarDays, Thermometer, Dices, Home, ChevronLeft, Settings2, Moon, Sun, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { icon: Home, label: "Home", href: "/today" },
    { icon: CalendarDays, label: "Planung", href: "/rotation" },
    { icon: ChefHat, label: "Rezepte", href: "/recipes" },
    { icon: Dices, label: "Quiz", href: "/quiz" },
    { icon: Thermometer, label: "HACCP", href: "/haccp" },
    { icon: Users, label: "Personal", href: "/schedule" },
  ];

  const showBackButton = location !== "/today" && location !== "/";
  const isSettings = location.startsWith("/settings");

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
          <span className="text-sm text-muted-foreground">
            Willkommen, <span className="text-foreground font-medium">{user?.name || "Gast"}</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/settings" className={cn(
            "flex items-center gap-1 p-2 text-sm transition-colors rounded-md",
            isSettings ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}>
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Einstellungen</span>
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1 p-2 text-sm text-muted-foreground hover:text-destructive transition-colors rounded-md"
            title="Abmelden"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
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
                  <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
