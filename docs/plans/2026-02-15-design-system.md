# The Folio Design System

**Product**: Agent Maker for Claude Code
**Approach**: Luxury editorial shell with bold agent color takeover
**Date**: 2026-02-15

---

## Philosophy

The Folio treats agent-building as a craft. The shared shell (sidebar, navigation, list pages) is a refined editorial canvas: warm neutrals, serif display headings, generous whitespace. When editing an agent, that agent's color bleeds into the environment via a scoped accent override — tinted mastheads, colored tab indicators, accent-driven buttons. The agent "owns" its space.

Two layers:
1. **Shell layer** — fixed design tokens (typography, spacing, radius, shadows, elevation)
2. **Agent accent layer** — CSS custom properties scoped to `[data-agent-color]`, dynamically set from the agent's color field

---

## 1. Typography

### Font Stack

| Role | Font | Weights | Use |
|------|------|---------|-----|
| Display | Playfair Display | 600, 700 | Page headings, agent masthead name, app title |
| Body | DM Sans | 400, 500, 600 | Body text, labels, nav, buttons, descriptions |
| Mono | JetBrains Mono | 400, 500 | System prompts, code, tool names, file paths |

### Type Scale (1.25 ratio)

| Token | Size | Line Height | Use |
|-------|------|-------------|-----|
| `text-xs` | 11px | 16px | Tertiary labels, timestamps |
| `text-sm` | 13px | 20px | Captions, metadata, badges |
| `text-base` | 16px | 24px | Body text, form inputs |
| `text-lg` | 20px | 28px | Section headings, card titles |
| `text-xl` | 25px | 32px | Page subtitles |
| `text-2xl` | 32px | 40px | Page headings |
| `text-3xl` | 40px | 48px | Agent editor masthead name |

### Letter Spacing

| Context | Value |
|---------|-------|
| Headings (Playfair) | `-0.02em` |
| Body (DM Sans) | `0` |
| Labels / uppercase | `0.05em` |
| Mono | `0` |

### Weight Rules

- Playfair Display: 700 for headings, 600 for emphasis
- DM Sans: 400 body, 500 labels/nav, 600 buttons/bold
- JetBrains Mono: 400 code, 500 emphasized code

---

## 2. Color Palette

### Shell Palette — Light Mode

| Token | Hex | HSL | Use |
|-------|-----|-----|-----|
| `--background` | `#FAFAF7` | `50 20% 97%` | Page background (warm off-white) |
| `--foreground` | `#1A1A1A` | `0 0% 10%` | Primary text |
| `--surface` | `#FFFFFF` | `0 0% 100%` | Cards, panels |
| `--surface-raised` | `#F5F5F0` | `50 14% 95%` | Sidebar, secondary panels |
| `--muted-foreground` | `#6B6B6B` | `0 0% 42%` | Secondary text |
| `--subtle-foreground` | `#9B9B9B` | `0 0% 61%` | Placeholders, tertiary |
| `--border` | `#E8E8E3` | `50 10% 90%` | Default borders |
| `--border-strong` | `#D1D1CB` | `50 5% 81%` | Emphasized borders |
| `--ring` | `#1A1A1A` | `0 0% 10%` | Focus rings |
| `--destructive` | `#DC2626` | `0 84% 50%` | Error / delete |
| `--success` | `#16A34A` | `142 72% 36%` | Success states |

### Shell Palette — Dark Mode

| Token | Hex | HSL | Use |
|-------|-----|-----|-----|
| `--background` | `#111110` | `60 4% 7%` | Deep warm black |
| `--foreground` | `#EDEDEB` | `50 6% 93%` | Primary text |
| `--surface` | `#1C1C1A` | `60 5% 10%` | Cards, panels |
| `--surface-raised` | `#161615` | `60 3% 8%` | Sidebar |
| `--muted-foreground` | `#8A8A85` | `50 3% 53%` | Secondary text |
| `--subtle-foreground` | `#5C5C58` | `50 3% 35%` | Placeholders |
| `--border` | `#2A2A27` | `50 5% 16%` | Borders |
| `--border-strong` | `#3D3D38` | `50 5% 23%` | Emphasized borders |
| `--ring` | `#EDEDEB` | `50 6% 93%` | Focus rings |
| `--destructive` | `#EF4444` | `0 84% 60%` | Error / delete |
| `--success` | `#22C55E` | `142 71% 45%` | Success |

### Agent Accent Colors

Each agent has a color. When editing an agent, its color drives the `--accent` variable.

| Name | Light Hex | Dark Hex |
|------|-----------|----------|
| Slate | `#475569` | `#94A3B8` |
| Red | `#DC2626` | `#F87171` |
| Orange | `#EA580C` | `#FB923C` |
| Amber | `#D97706` | `#FBBF24` |
| Emerald | `#059669` | `#34D399` |
| Teal | `#0D9488` | `#2DD4BF` |
| Blue | `#2563EB` | `#60A5FA` |
| Indigo | `#4F46E5` | `#818CF8` |
| Violet | `#7C3AED` | `#A78BFA` |
| Purple | `#9333EA` | `#C084FC` |
| Pink | `#DB2777` | `#F472B6` |
| Rose | `#E11D48` | `#FB7185` |

Derived tokens (auto-generated per agent):
- `--accent` — full color
- `--accent-foreground` — contrast text (white or dark)
- `--accent-muted` — 15% opacity over surface
- `--accent-subtle` — 8% opacity (washes)

---

## 3. Spacing

4px base unit.

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

---

## 4. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 4px | Badges, tags |
| `radius-md` | 8px | Buttons, inputs, small cards |
| `radius-lg` | 12px | Cards, dialogs, panels |
| `radius-xl` | 16px | Feature cards, hero elements |
| `radius-full` | 9999px | Avatars, pills, dots |

---

## 5. Elevation (Shadows)

### Light Mode

| Token | Value | Use |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | Inputs |
| `shadow-md` | `0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Cards |
| `shadow-lg` | `0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | Hover, dropdowns |
| `shadow-xl` | `0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)` | Dialogs |

### Dark Mode

| Token | Value | Use |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.2)` | Inputs |
| `shadow-md` | `0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Cards |
| `shadow-lg` | `0 4px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)` | Hover, dropdowns |
| `shadow-xl` | `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)` | Dialogs |

---

## 6. Components

### Buttons

**Variants**:

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Primary | `--foreground` (shell) / `--accent` (agent pages) | `--background` / `--accent-foreground` | none | Main CTAs |
| Secondary | `--surface` | `--foreground` | `--border` | Secondary actions |
| Ghost | transparent | `--foreground` | none | Tertiary, nav |
| Destructive | `--destructive` | white | none | Delete |
| Outline | transparent | `--foreground` | `--border-strong` | Alternative secondary |

**Sizes**: sm (28px h, text-xs), md (36px h, text-sm), lg (44px h, text-base)

**States**:
- Hover: brightness shift + shadow-sm
- Active: scale(0.98), shadow drops
- Focus: 2px ring offset with `--ring`
- Disabled: 50% opacity

### Cards

- Background: `--surface`, border: `--border` 1px, radius-lg, shadow-md
- Hover: shadow-lg, border to `--border-strong`, translateY(-1px)
- Agent cards (list): 8px colored pip top-right corner
- Agent editor cards: 2px `--accent-subtle` top border

### Inputs & Textareas

- Background: `--surface`, border: `--border`, radius-md
- Focus: border becomes `--accent` (agent pages) or `--foreground` (shell)
- Labels: DM Sans 500, text-sm, `--muted-foreground`, uppercase, tracking 0.05em

### Badges

- Default: `--surface-raised` bg, `--muted-foreground` text, radius-sm
- Agent-colored: `--accent-muted` bg, `--accent` text
- Status: emerald (active), amber (draft), slate (archived)

### Tabs

- Underline style (not boxed)
- Inactive: `--muted-foreground`
- Active: `--foreground` (shell) / `--accent` (agent editor), 2px bottom border
- Font: DM Sans 500, text-sm, uppercase, tracking 0.05em

### Dialogs

- Backdrop: rgba(0,0,0,0.4) + backdrop-filter: blur(4px)
- Panel: `--surface`, radius-xl, shadow-xl
- Enter: fade + scale 0.96 -> 1, 200ms ease-out
- Exit: fade + scale 1 -> 0.98, 150ms ease-in

### Sidebar

- Background: `--surface-raised`
- Width: 260px expanded, 60px collapsed
- Nav items: ghost button style, radius-md
- Active nav: foreground at 5% opacity bg (shell) / `--accent-subtle` (agent context)
- App title: Playfair Display 700, text-lg

### Tooltips

- Background: `--foreground`, text: `--background` (inverted)
- Radius-sm, shadow-lg
- DM Sans 400, text-xs
- Enter: fade + translateY(4px), 150ms

---

## 7. Motion & Animation

Luxury editorial motion: restrained, deliberate. Every animation feels like turning a page.

| Animation | Duration | Easing | Use |
|-----------|----------|--------|-----|
| Page transition | 300ms | ease-out | Fade + translateY(8px) on mount |
| Card hover | 200ms | ease | Shadow lift + border shift |
| Button press | 100ms | ease-in | scale(0.98) |
| Dialog enter | 200ms | cubic-bezier(0.16,1,0.3,1) | scale 0.96->1 + fade |
| Dialog exit | 150ms | ease-in | scale 1->0.98 + fade |
| Sidebar collapse | 200ms | ease-in-out | Width transition |
| List stagger | 50ms delay/item | ease-out | Cards fade + translateY |
| Tab switch | 200ms | ease | Underline slide + content crossfade |
| Toast enter | 300ms | cubic-bezier(0.16,1,0.3,1) | Slide from right + fade |
| Skeleton pulse | 1.5s | ease-in-out infinite | Loading states |

Use Framer Motion for: page transitions (AnimatePresence), list stagger (staggerChildren), dialog enter/exit.
Use CSS transitions for: hover states, focus, color changes.

---

## 8. Agent Editor — The Takeover System

When a user enters `/agents/:id`, the editor wrapper receives `data-agent-color="blue"`. This triggers:

1. **Masthead**: Full-width header with `--accent-subtle` background wash. Agent icon at lg size with `--accent` background. Name in Playfair Display 700 at text-3xl.

2. **Tab bar**: Active indicator uses `--accent`.

3. **Primary buttons**: Background shifts from `--foreground` to `--accent`.

4. **Input focus**: Ring color shifts from `--foreground` to `--accent`.

5. **Decorative rule**: 1px `--accent` at 30% opacity below masthead.

6. **Icon/color picker**: Selected color gets `--accent` ring. Picker panel has `--accent-subtle` wash.

Shell elements (sidebar, secondary buttons, cards, body text) stay in the shell palette. The takeover is bold but bounded.

---

## 9. Implementation Architecture

### CSS Custom Properties

All design tokens live as CSS variables on `:root` (light) and `.dark` (dark mode). Agent accent overrides are scoped to `[data-agent-color]` attribute selectors.

### Tailwind Integration

Tailwind config maps semantic tokens to CSS variables. Components use Tailwind classes referencing these tokens. No hardcoded colors in components.

### Agent Color Application

```tsx
// In agent editor wrapper
<div data-agent-color={agent.color} style={{
  '--accent': agentColors[agent.color],
  '--accent-foreground': getContrastColor(agent.color),
  '--accent-muted': `${agentColors[agent.color]}26`,  // 15% opacity
  '--accent-subtle': `${agentColors[agent.color]}14`,  // 8% opacity
}}>
```

### Font Loading

Only three fonts loaded via Google Fonts:
- Playfair Display (600, 700)
- DM Sans (400, 500, 600)
- JetBrains Mono (400, 500)
