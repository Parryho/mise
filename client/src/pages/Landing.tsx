import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Landing() {
  const [, navigate] = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="theme-petrol h-[100dvh] bg-background overflow-hidden flex items-center justify-center px-6 relative">

      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full landing-float bg-[radial-gradient(ellipse,hsla(190,100%,23%,0.10),transparent_70%)]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[55%] h-[55%] rounded-full landing-float-reverse bg-[radial-gradient(ellipse,hsla(190,100%,23%,0.07),transparent_70%)]" />
        <div className="absolute top-[35%] right-[15%] w-[35%] h-[35%] rounded-full landing-float bg-[radial-gradient(ellipse,hsla(119,20%,42%,0.06),transparent_70%)]" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(0 0% 50%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo (replaces large MISE text) */}
        <div className={cn("transition-all duration-1000 ease-out",
          ready ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95")}>
          <img
            src="/mise-logo-new.png"
            alt="Mise"
            className="h-36 sm:h-44 md:h-52 mx-auto mb-4 drop-shadow-sm"
          />
        </div>

        {/* Subtitle */}
        <div className={cn("transition-all duration-1000 ease-out",
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
          style={{ transitionDelay: "200ms" }}>
          <p className="text-base sm:text-lg text-muted-foreground font-sans normal-case tracking-[0.02em] italic">
            — before Serve
          </p>
        </div>

        {/* Accent line */}
        <div className={cn("mx-auto mt-6 h-[3px] rounded-full bg-primary/60 transition-all duration-1000 ease-out",
          ready ? "w-12 opacity-100" : "w-0 opacity-0")}
          style={{ transitionDelay: "400ms" }}
        />

        {/* Tagline */}
        <div className={cn("transition-all duration-1000 ease-out",
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
          style={{ transitionDelay: "500ms" }}>
          <p className="mt-6 text-base sm:text-lg text-foreground/75 font-sans normal-case tracking-normal max-w-md mx-auto leading-relaxed">
            Dein digitales{" "}
            <span className="text-primary font-semibold">Mise en Place</span>{" "}
            für die Profiküche.
          </p>
        </div>

        {/* CTAs */}
        <div className={cn("mt-10 flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ease-out",
          ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
          style={{ transitionDelay: "700ms" }}>
          <Button size="lg" className="text-base px-8 gap-3 shadow-lg shadow-primary/20"
            onClick={() => navigate("/login")}>
            Login <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8 gap-3"
            onClick={() => navigate("/register")}>
            Registrieren <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
