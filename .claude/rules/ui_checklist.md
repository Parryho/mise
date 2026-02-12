# UI Quality Checklist

## Responsive Layout
- [ ] Content fills available width on desktop (no phone-emulator framing)
- [ ] Grids expand columns at `md` and `lg` breakpoints
- [ ] Dialogs use `max-w-lg` or wider on desktop
- [ ] No horizontal overflow on mobile viewport

## Touch Targets
- [ ] All interactive elements >= 44px in both dimensions
- [ ] Bottom nav items: `min-w-[60px] min-h-[48px]`
- [ ] Icon buttons: minimum `h-9 w-9` (36px — acceptable for secondary actions)
- [ ] Primary action buttons: minimum `min-h-9` (36px height)

## Typography
- [ ] Smallest text >= 10px (`text-[10px]`)
- [ ] Body text: 14px (`text-sm`) or 16px (`text-base`)
- [ ] Headings use `font-heading` (Oswald)
- [ ] No `font-bold` on body text — use `font-medium` or `font-semibold`

## Color & Contrast
- [ ] Status indicators use `--status-*` tokens, not hardcoded colors
- [ ] Text on colored backgrounds meets WCAG AA (4.5:1 for normal text)
- [ ] Muted text (`text-muted-foreground`) meets 3:1 minimum
- [ ] Dark mode tokens defined for all custom colors

## Shadows & Elevation
- [ ] Cards use `shadow-sm` (elevation-1), not `shadow` or `shadow-md`
- [ ] Only dialogs/popovers use `shadow-md` (elevation-2)
- [ ] Flat interactive elements use `elevation-0` (border only)
- [ ] No `shadow-2xl` on layout containers

## Interaction States
- [ ] Tappable elements use `.press` or `active:scale-[0.98]`
- [ ] Focus rings visible (`focus-visible:ring-1 ring-ring`)
- [ ] Disabled states use `opacity-50` + `pointer-events-none`
- [ ] No `hover-elevate` or `active-elevate` (removed non-standard utilities)

## Accessibility
- [ ] All images have `alt` attributes
- [ ] Interactive elements have accessible labels
- [ ] Color is not the only indicator of state (icons/text accompany color)
- [ ] Keyboard navigation works for all interactive elements
- [ ] `aria-label` on icon-only buttons

## Code Quality
- [ ] No `// @replit` comments in component files
- [ ] Consistent use of design tokens over hardcoded Tailwind colors
- [ ] Status colors use semantic tokens (`status-info`, `status-success`, etc.)
- [ ] Event type colors use muted palette (`-50` bg, `-600` text)
