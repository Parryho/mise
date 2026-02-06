import { Link, useLocation } from "wouter";
import { ChefHat, Users, CalendarDays, Settings, UtensilsCrossed, ListTodo, FileBarChart, RefreshCw, ShoppingCart, ClipboardList, Printer, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: ListTodo, label: "Heute", href: "/today" },
    { icon: ChefHat, label: t("recipes"), href: "/recipes" },
    { icon: UtensilsCrossed, label: "Menü", href: "/menu" },
    { icon: RefreshCw, label: "Rotation", href: "/rotation" },
    { icon: CalendarDays, label: "Dienst", href: "/schedule" },
    { icon: Users, label: "Gäste", href: "/guests" },
    { icon: PartyPopper, label: "Events", href: "/catering" },
    { icon: ClipboardList, label: "Produktion", href: "/production" },
    { icon: ShoppingCart, label: "Einkauf", href: "/shopping" },
    { icon: FileBarChart, label: "Reports", href: "/reports" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:max-w-2xl lg:max-w-5xl md:mx-auto overflow-hidden relative">
      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-20 safe-area-bottom custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation - Scrollable */}
      <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-card border-t border-border/50 h-[var(--nav-height)] pb-safe z-50 md:w-full md:max-w-2xl lg:max-w-5xl md:mx-auto">
        <div className="flex h-full overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 h-full min-w-[60px] min-h-[48px] px-2",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium uppercase tracking-wider whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
