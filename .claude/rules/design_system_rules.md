# Mise Design System Rules

Rules for implementing Figma designs in the mise.at codebase using the Figma MCP integration.

---

## Stack Overview

| Layer | Technology |
|-------|-----------|
| Framework | React 19 (SPA, no SSR/RSC) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Component Library | shadcn/ui (New York style) |
| Variant System | class-variance-authority (cva) |
| Class Merging | `cn()` from `@/lib/utils` (clsx + tailwind-merge) |
| Icons | Lucide React (`lucide-react`) |
| Build | Vite 7 |
| Fonts | Inter (body), Oswald (headings), Roboto Mono (code) |

---

## Token Mapping (Figma → Code)

### Brand Colors

| Figma Token | CSS Variable | Tailwind Class | Hex |
|-------------|-------------|----------------|-----|
| Primary / Orange | `--primary: 22 90% 54%` | `bg-primary`, `text-primary` | #F37021 |
| Primary Foreground | `--primary-foreground: 0 0% 100%` | `text-primary-foreground` | #FFFFFF |
| Secondary | `--secondary: 30 30% 95%` | `bg-secondary` | ~#F5F0EB |
| Accent / Green | `--accent: 142 76% 36%` | `bg-accent`, `text-accent` | ~#16A34A |
| Destructive / Red | `--destructive: 0 84% 60%` | `bg-destructive` | ~#EF4444 |

### Semantic Status Colors

Each status has 3 variants: solid (`bg-status-X`), foreground (`text-status-X-foreground`), subtle (`bg-status-X-subtle`).

| Status | Variable | Tailwind | Usage |
|--------|----------|----------|-------|
| Info | `--status-info: 217 91% 60%` | `bg-status-info` | Planned, informational |
| Success | `--status-success: 142 76% 36%` | `bg-status-success` | Confirmed, active |
| Warning | `--status-warning: 38 92% 50%` | `bg-status-warning` | Needs attention |
| Danger | `--status-danger: 0 84% 60%` | `bg-status-danger` | Errors, cancelled |
| Neutral | `--status-neutral: 220 9% 46%` | `bg-status-neutral` | Completed, archived |

**Usage pattern:**
```tsx
// Solid badge
<span className="bg-status-success text-status-success-foreground px-2 py-0.5 rounded">Active</span>

// Subtle/tinted background
<span className="bg-status-info-subtle text-status-info px-2 py-0.5 rounded">Planned</span>
```

### Neutrals

| Token | Variable | Tailwind |
|-------|----------|----------|
| Background | `--background: 30 20% 98%` | `bg-background` (warm cream) |
| Foreground | `--foreground: 20 20% 15%` | `text-foreground` (warm brown) |
| Card | `--card: 0 0% 100%` | `bg-card` |
| Muted | `--muted: 30 20% 94%` | `bg-muted`, `text-muted-foreground` |
| Border | `--border: 30 20% 88%` | `border-border` |

### Layout Tokens

| Token | Value | Tailwind |
|-------|-------|----------|
| `--radius` | `0.5rem` | `rounded-md` (default) |
| `--nav-height` | `4rem` (64px) | Bottom nav height |

---

## Typography

| Element | Font | Tailwind | Notes |
|---------|------|----------|-------|
| Headings (h1-h6) | Oswald | `font-heading uppercase tracking-wide` | Applied globally in `@layer base` |
| Body text | Inter | `font-sans` (default) | 400 weight |
| Monospace | Roboto Mono | `font-mono` | Code, data |

**Important:** All headings automatically get `font-heading uppercase tracking-wide` via global CSS. Do NOT add these classes manually to heading elements.

---

## Component Patterns

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variants: default | destructive | outline | secondary | ghost | link
// Sizes: default (36px) | sm (32px) | lg (40px) | icon (36x36)
<Button variant="default" size="default">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
```

All buttons include built-in `active:scale-[0.98]` press feedback.

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

Default styling: `rounded-lg border bg-card text-card-foreground shadow-sm`

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

// Variants: default | secondary | destructive | outline
<Badge variant="default">Active</Badge>
<Badge variant="outline">Draft</Badge>
```

Badges are informational only — no hover/click states.

### Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
```

### All Available UI Components

Located in `client/src/components/ui/`:
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner (toast), spinner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

---

## Elevation System

| Class | Effect | When to use |
|-------|--------|-------------|
| `.elevation-0` | No shadow, border only | Flat cards, category buttons |
| `.elevation-1` | `shadow-sm` | Default cards (already in Card) |
| `.elevation-2` | `shadow-md` | Dialogs, popovers, raised elements |

---

## Interaction Patterns

| Pattern | Class | Usage |
|---------|-------|-------|
| Press feedback | `.press` or `active:scale-[0.98]` | Tappable cards, interactive elements |
| Focus ring | `focus-visible:ring-1 focus-visible:ring-ring` | Already in Button, Input |

The `.press` utility class is defined in `index.css` and includes `active:scale-[0.98] transition-transform`.

---

## Touch Targets

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44px min height (see `min-h-9` = 36px for default) |
| Nav items | `min-w-[60px] min-h-[48px]` |
| Icon buttons | `h-9 w-9` (36px) |
| Nav icons | `h-6 w-6` (24px) |

---

## Responsive Layout

| Breakpoint | Width | Layout Pattern |
|------------|-------|----------------|
| Default (mobile) | < 768px | Single column, full-width |
| `md` | >= 768px | `max-w-2xl mx-auto` |
| `lg` | >= 1024px | `max-w-5xl mx-auto` |

**Standard page container:**
```tsx
<div className="max-w-2xl mx-auto p-4 pb-24">
  {/* pb-24 for bottom nav clearance */}
</div>
```

---

## Icon System

- **Library:** Lucide React (`lucide-react`)
- **Default size:** `h-4 w-4` (inside buttons), `h-5 w-5` (standalone), `h-6 w-6` (nav)
- **Import pattern:**
```tsx
import { Settings, Plus, Trash2, ChevronRight } from "lucide-react"
```
- Icons inside buttons are automatically sized to `size-4` via the button's `[&_svg]:size-4` class.

---

## Dark Mode

Dark mode is supported via the `.dark` class on a parent element. All CSS variables have dark-mode overrides defined in `index.css`. Use semantic token classes (`bg-background`, `text-foreground`, `bg-card`, etc.) and dark mode works automatically.

---

## Print Styles

Print is supported with `@media print` rules in `index.css`:
- A4 portrait, 5mm margins
- Navigation hidden (`nav`, `header`, `.print-hide`, `.print:hidden`)
- Compact table styling for rotation print pages

---

## File Structure for New Components

```
client/src/
├── components/
│   ├── ui/           # shadcn/ui primitives (DO NOT modify)
│   ├── MyComponent.tsx   # App-specific components
│   └── ...
├── pages/
│   ├── MyPage.tsx    # Full page components
│   └── analytics/    # Analytics sub-pages
├── hooks/            # Custom hooks (useXxx.ts)
├── lib/
│   ├── utils.ts      # cn() utility
│   └── ...           # Other utilities
└── i18n/             # Translations (de.json, en.json)
```

---

## Key Conventions

1. **Always use `cn()`** for className merging — never concatenate strings manually
2. **Use shadcn/ui components** before creating custom ones
3. **Use CSS variable tokens** (`bg-primary`, `text-foreground`) — never hardcode colors
4. **Status colors** use the 5-variant system (`info/success/warning/danger/neutral`)
5. **Headings** get Oswald font automatically — just use `<h1>`, `<h2>`, etc.
6. **Mobile-first** — design for mobile, then add `md:` and `lg:` breakpoints
7. **Icons from Lucide** — import individually, never install additional icon packages
8. **Imports use path aliases**: `@/components/...`, `@/lib/...`, `@/hooks/...`
9. **No hover-only interactions** — this is a kitchen app used with wet/gloved hands
10. **German UI** — primary language is German, English as secondary (i18n)

---

## Figma-to-Code Mapping Checklist

When implementing a Figma design:

- [ ] Map Figma colors to CSS variable tokens (never use raw hex)
- [ ] Use existing shadcn/ui components where possible
- [ ] Apply correct elevation class (0/1/2)
- [ ] Ensure 44px minimum touch targets
- [ ] Add `.press` class to tappable non-button elements
- [ ] Use `font-heading` only if Figma shows Oswald (headings get it automatically)
- [ ] Check responsive behavior at mobile/md/lg breakpoints
- [ ] Add `print:hidden` to elements that shouldn't print
- [ ] Use Lucide icons matching Figma iconography
- [ ] Verify dark mode compatibility (use token classes, not raw colors)
