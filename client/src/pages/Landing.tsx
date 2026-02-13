import { useState, useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BookOpen, CalendarDays, Thermometer, Smartphone,
  ChevronDown, ArrowRight, Shield, Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Scroll-triggered reveal ── */

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={cn(className, "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Animated counter ── */

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const dur = 1400;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);
            setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref} className="tabular-nums">{value}{suffix}</span>;
}

/* ── Data ── */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Rezeptdatenbank",
    desc: "Alle Rezepte an einem Ort. Zutaten, Zubereitungsschritte, Fotos — mit automatischer Allergen-Erkennung nach EU-Verordnung.",
    gradient: "from-orange-500/10 to-amber-500/5",
    color: "text-orange-500",
    border: "group-hover:border-orange-200",
  },
  {
    icon: CalendarDays,
    title: "Menüplanung",
    desc: "6-Wochen-Rotation mit intelligenter Beilagen-Zuordnung. Drag & Drop Wochenplan — die ganze Woche in wenigen Minuten.",
    gradient: "from-emerald-500/10 to-green-500/5",
    color: "text-emerald-500",
    border: "group-hover:border-emerald-200",
  },
  {
    icon: Shield,
    title: "Allergen-Übersicht",
    desc: "14 EU-Allergene (A–R) automatisch aus Rezepten erkannt. Tagesmatrix auf einen Blick — sofort klar, was drin ist.",
    gradient: "from-blue-500/10 to-cyan-500/5",
    color: "text-blue-500",
    border: "group-hover:border-blue-200",
  },
  {
    icon: Thermometer,
    title: "HACCP-Dokumentation",
    desc: "Temperatur-Logging für alle Kühlgeräte. Anomalie-Erkennung und Compliance-Reports — Audit-sicher auf Knopfdruck.",
    gradient: "from-rose-500/10 to-pink-500/5",
    color: "text-rose-500",
    border: "group-hover:border-rose-200",
  },
];

const STEPS = [
  { num: "01", title: "Planen", desc: "Rotation erstellen, Wochenplan befüllen, Einkaufsliste generieren." },
  { num: "02", title: "Kochen", desc: "Rezepte aufrufen, Portionen skalieren, Allergene prüfen." },
  { num: "03", title: "Dokumentieren", desc: "Temperaturen loggen, HACCP einhalten, alles nachweisbar." },
];

const STATS = [
  { value: 335, suffix: "+", label: "Rezepte", sub: "in der Datenbank" },
  { value: 14, suffix: "", label: "Allergene", sub: "EU-konform (A–R)" },
  { value: 6, suffix: "", label: "Wochen", sub: "Rotationszyklus" },
  { value: 8, suffix: "", label: "Slots", sub: "pro Tagesmenü" },
];

/* ── Landing Page ── */

export default function Landing() {
  const [, navigate] = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/20">

      {/* ╔══════════════════════════════════════╗
          ║              H E R O                 ║
          ╚══════════════════════════════════════╝ */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">

        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full landing-float bg-[radial-gradient(ellipse,hsla(22,90%,54%,0.14),transparent_70%)]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[55%] h-[55%] rounded-full landing-float-reverse bg-[radial-gradient(ellipse,hsla(22,90%,54%,0.09),transparent_70%)]" />
          <div className="absolute top-[35%] right-[15%] w-[35%] h-[35%] rounded-full landing-float bg-[radial-gradient(ellipse,hsla(142,76%,36%,0.05),transparent_70%)]" />
        </div>

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(20 20% 15%) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className={cn("transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95")}>
            <img src="/mise-logo.png" alt="Mise Logo" className="h-20 md:h-28 mx-auto mb-8 drop-shadow-sm" />
          </div>

          <div className={cn("transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
            style={{ transitionDelay: "150ms" }}>
            <h1 className="text-7xl sm:text-8xl md:text-9xl tracking-[-0.04em] leading-[0.85]">
              MISE
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-sans normal-case tracking-[0.02em] italic mt-3">
              — before Serve
            </p>
          </div>

          {/* Orange accent line */}
          <div className={cn("mx-auto mt-8 h-[3px] rounded-full bg-primary/60 transition-all duration-1000 ease-out",
            ready ? "w-16 opacity-100" : "w-0 opacity-0")}
            style={{ transitionDelay: "400ms" }}
          />

          <div className={cn("transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
            style={{ transitionDelay: "500ms" }}>
            <p className="mt-8 text-lg md:text-xl text-foreground/75 font-sans normal-case tracking-normal max-w-xl mx-auto leading-relaxed">
              Dein digitales{" "}
              <span className="text-primary font-semibold">Mise en Place</span>{" "}
              für die Profiküche.<br className="hidden sm:block" />
              Rezepte, Allergene, Menüplanung — alles an einem Ort.
            </p>
          </div>

          <div className={cn("mt-10 flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ease-out",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
            style={{ transitionDelay: "700ms" }}>
            <Button size="lg" className="text-base px-8 gap-3 shadow-lg shadow-primary/20"
              onClick={() => navigate("/login")}>
              Jetzt starten <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="text-base px-8 gap-3"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Mehr erfahren <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scroll pill */}
        <div className={cn("absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-1000",
          ready ? "opacity-100" : "opacity-0")} style={{ transitionDelay: "1200ms" }}>
          <div className="w-6 h-10 rounded-full border-2 border-foreground/15 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-foreground/30 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║           F E A T U R E S            ║
          ╚══════════════════════════════════════╝ */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Utensils className="h-3.5 w-3.5" />
                Funktionen
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl">
                Alles was deine Küche braucht
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto font-sans normal-case tracking-normal">
                Vier Kernbereiche, die den Küchenalltag vereinfachen. Keine Spielerei — nur das Wesentliche.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className={cn(
                  "group relative rounded-xl border border-border/50 bg-card p-7 md:p-8 transition-all duration-300",
                  "hover:shadow-lg hover:shadow-black/[0.03]", f.border,
                )}>
                  <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", f.gradient)} />
                  <div className="relative">
                    <div className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center mb-5 bg-background border border-border/50 shadow-sm",
                      "group-hover:scale-110 transition-transform duration-300",
                    )}>
                      <f.icon className={cn("h-5 w-5", f.color)} />
                    </div>
                    <h3 className="text-xl mb-2">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-sans normal-case tracking-normal text-[15px]">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║          W O R K F L O W             ║
          ╚══════════════════════════════════════╝ */}
      <section className="py-24 md:py-32 px-6 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl">So einfach geht's</h2>
              <p className="mt-4 text-muted-foreground text-lg font-sans normal-case tracking-normal">
                Drei Schritte. Jeden Tag. Ohne Bürochaos.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 150}>
                <div className="relative text-center md:text-left">
                  <span className="block text-6xl md:text-7xl font-heading font-bold text-primary/[0.12] leading-none select-none">
                    {s.num}
                  </span>
                  <h3 className="text-2xl mt-2 mb-3">{s.title}</h3>
                  <p className="text-muted-foreground font-sans normal-case tracking-normal leading-relaxed">{s.desc}</p>

                  {/* Connector arrow (desktop) */}
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-8 -right-3 text-border h-5 w-5" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║            S T A T S                 ║
          ╚══════════════════════════════════════╝ */}
      <section className="py-24 md:py-28 px-6 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold leading-none mb-2">
                    <Counter target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-base md:text-lg font-heading uppercase tracking-wider opacity-90">{s.label}</div>
                  <div className="text-sm opacity-40 mt-1 font-sans normal-case tracking-normal">{s.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║        M O B I L E - F I R S T       ║
          ╚══════════════════════════════════════╝ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-14 md:gap-20">
          <Reveal className="flex-1">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-6">
              <Smartphone className="h-3.5 w-3.5" />
              Mobile-First
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6">
              Gebaut für die Küche
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed font-sans normal-case tracking-normal mb-8">
              Große Touch-Ziele, schnelles Scrollen, minimales Tippen. Mise funktioniert mit nassen Händen genauso gut wie am Schreibtisch.
            </p>
            <ul className="space-y-4">
              {[
                "PWA — installierbar wie eine native App",
                "Offline-fähig für schlechten Empfang",
                "Optimiert für Handy-Nutzung in der Küche",
              ].map((txt) => (
                <li key={txt} className="flex items-start gap-3 text-foreground/80 font-sans normal-case tracking-normal">
                  <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                  {txt}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Phone mockup */}
          <Reveal className="flex-shrink-0" delay={200}>
            <div className="relative">
              <div className="w-[250px] sm:w-[270px] h-[500px] sm:h-[540px] rounded-[2.5rem] border-[7px] border-foreground/85 bg-card shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/85 rounded-b-xl z-10" />
                {/* Status bar */}
                <div className="h-10 bg-primary/5" />
                {/* Mock content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-sm bg-primary/40" />
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-foreground/10 rounded" />
                      <div className="h-2 w-14 bg-foreground/5 rounded mt-1" />
                    </div>
                  </div>
                  {/* Card rows */}
                  {[
                    { dot: "bg-primary", w1: "w-28", w2: "w-full", w3: "w-3/4" },
                    { dot: "bg-emerald-500", w1: "w-32", w2: "w-full", w3: "w-2/3" },
                    { dot: "bg-blue-500", w1: "w-24", w2: "w-full", w3: "w-1/2" },
                    { dot: "bg-rose-400", w1: "w-20", w2: "w-4/5", w3: "w-3/5" },
                  ].map((c, i) => (
                    <div key={i} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", c.dot)} />
                        <div className={cn("h-2.5 bg-foreground/8 rounded", c.w1)} />
                      </div>
                      <div className={cn("h-1.5 bg-foreground/4 rounded", c.w2)} />
                      <div className={cn("h-1.5 bg-foreground/4 rounded", c.w3)} />
                    </div>
                  ))}
                </div>
                {/* Bottom nav */}
                <div className="absolute bottom-0 inset-x-0 h-14 border-t border-border/50 bg-card/95 backdrop-blur flex items-center justify-around px-5">
                  {[true, false, false, false, false].map((active, i) => (
                    <div key={i} className={cn("w-7 h-7 rounded-md", active ? "bg-primary/15" : "bg-foreground/[0.04]")} />
                  ))}
                </div>
              </div>
              {/* Ambient glow */}
              <div className="absolute -inset-6 -z-10 rounded-[3.5rem] bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-transparent blur-2xl" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║              C T A                   ║
          ╚══════════════════════════════════════╝ */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-[radial-gradient(ellipse,hsla(22,90%,54%,0.07),transparent_70%)]" />
        </div>

        <Reveal>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6">
              Bereit für Mise en Place?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 font-sans normal-case tracking-normal">
              Weniger fragen, schneller kochen, sicher dokumentieren. Starte jetzt mit mise.
            </p>
            <Button size="lg" className="text-base px-10 gap-3 shadow-lg shadow-primary/20"
              onClick={() => navigate("/login")}>
              Kostenlos starten <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║           F O O T E R                ║
          ╚══════════════════════════════════════╝ */}
      <footer className="py-8 px-6 border-t border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/mise-logo.png" alt="Mise" className="h-5 opacity-70" />
            <span className="text-sm text-muted-foreground font-sans normal-case tracking-normal">
              &copy; {new Date().getFullYear()} mise.at
            </span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans normal-case tracking-normal"
          >
            Login
          </button>
        </div>
      </footer>
    </div>
  );
}
