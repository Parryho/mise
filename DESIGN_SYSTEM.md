# Mise Design System

## Color Tokens

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `hsl(22 90% 54%)` — Mise Orange | Buttons, active nav, links |
| `--secondary` | `hsl(30 30% 95%)` | Secondary buttons, backgrounds |
| `--accent` | `hsl(142 76% 36%)` — Kitchen Green | Fresh/safe indicators |
| `--destructive` | `hsl(0 84% 60%)` | Delete, error states |

### Semantic Status Colors
| Token | Light | Usage |
|-------|-------|-------|
| `--status-info` | Blue `hsl(217 91% 60%)` | Planned, informational |
| `--status-success` | Green `hsl(142 76% 36%)` | Confirmed, success |
| `--status-warning` | Amber `hsl(38 92% 50%)` | Warnings, attention |
| `--status-danger` | Red `hsl(0 84% 60%)` | Cancelled, errors |
| `--status-neutral` | Gray `hsl(220 9% 46%)` | Completed, archived |

Each status token has `-foreground` (text on solid bg) and `-subtle` (tinted background) variants.

**Usage in Tailwind:**
```html
<span class="bg-status-info-subtle text-status-info">Planned</span>
<div class="bg-status-success text-status-success-foreground">Success</div>
```

## Typography

| Element | Font | Weight | Transform |
|---------|------|--------|-----------|
| Headings (h1–h6) | Oswald | — | `uppercase tracking-wide` |
| Body | Inter | 400 | — |
| Mono | Roboto Mono | — | — |

## Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--nav-height` | `4rem` (64px) | Bottom navigation height |
| `--radius` | `0.5rem` | Default border radius |

### Breakpoints
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Default | < 768px | Single column, full width |
| `md` | >= 768px | `max-w-2xl` centered |
| `lg` | >= 1024px | `max-w-5xl` centered |

## Elevation System

| Class | Effect | Usage |
|-------|--------|-------|
| `.elevation-0` | Border only, no shadow | Category buttons, flat cards |
| `.elevation-1` | `shadow-sm` | Default cards |
| `.elevation-2` | `shadow-md` | Dialogs, popovers, raised elements |

## Interaction

| Class | Effect | Usage |
|-------|--------|-------|
| `.press` | `active:scale-[0.98]` | Tappable cards, category buttons |
| Button `active:scale-[0.98]` | Built into Button component | All buttons |

## Components

### Button
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default` (36px), `sm` (32px), `lg` (40px), `icon` (36x36)
- All variants include `active:scale-[0.98]` press feedback
- Uses theme token borders (e.g. `border-primary/80`)

### Card
- Default: `rounded-lg border bg-card shadow-sm`
- Use `elevation-0` for flat appearance, `elevation-2` for raised

### Badge
- Variants: `default`, `secondary`, `destructive`, `outline`
- No hover elevation — badges are informational, not interactive

## Touch Targets
- Minimum: 44px (both dimensions)
- Nav items: `min-w-[60px] min-h-[48px]`
- Nav icons: `h-6 w-6` (24px)
- Nav labels: `text-[10px]`
