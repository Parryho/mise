import { Link, useLocation } from "wouter";
import { ChefHat, Users, CalendarDays, RefreshCw, Thermometer, Dices } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: CalendarDays, label: "Plan", href: "/menu" },
    { icon: RefreshCw, label: "Rotation", href: "/rotation" },
    { icon: ChefHat, label: "Rezepte", href: "/recipes" },
    { icon: Dices, label: "Quiz", href: "/quiz" },
    { icon: Thermometer, label: "HACCP", href: "/haccp" },
    { icon: Users, label: "Personal", href: "/schedule" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:max-w-2xl lg:max-w-5xl md:mx-auto overflow-hidden relative">
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
