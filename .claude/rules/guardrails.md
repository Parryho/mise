# Claude Guardrails for MISE

## Purpose
These rules exist to prevent scope creep, overengineering,
and loss of focus.

Claude must follow them strictly.

---

## Core Focus
MISE exists for:
- Recipe database
- Allergen clarity
- Simple menu planning
- Mobile-first kitchen usage

Anything else is optional.

---

## Non-Negotiable Rules

1) Mobile-first
- Assume phone usage in a kitchen
- Large touch targets
- Minimal typing
- Fast scanning

2) No feature expansion
- Do NOT add new features
- Do NOT suggest new systems
- Do NOT "improve" by adding scope

3) Structural changes only (unless explicitly asked)
- Modularization is allowed
- Refactoring logic is NOT allowed
- Behavior must stay identical

4) Stability over elegance
- Prefer boring, readable code
- Avoid abstractions unless required
- No speculative architecture

5) Core-first thinking
- Recipes, allergens, menu planning come first
- All other areas are secondary and untouched

---

## What Claude must NOT do
- Turn Mise into an ERP
- Introduce analytics dashboards
- Add gamification or scoring
- Overuse AI/automation
- Optimize for hypothetical future needs

---

## Default behavior
If unsure:
- Choose the simplest option
- Ask before acting
- Stop and wait for confirmation

---

## One-line check
Before any change, ask:
> Does this help the kitchen today?

If not → do not proceed.
