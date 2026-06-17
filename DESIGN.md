# Design System — ruiqian.dev

The documented language for the site. Tokens live in
[`src/styles/global.css`](src/styles/global.css); edit them there and the
whole site follows. This file explains the *intent* so the look evolves
deliberately instead of drifting.

## Identity
A minimal, fast, tactile engineering portfolio. Restrained surfaces and
generous whitespace, punctuated by a few high-craft moments (holographic ID
card, physics-based project deck). Personality lives in motion and one or two
hero interactions — never in clutter.

## Color
Driven entirely by CSS custom properties with a light and dark theme. Accent
is electric blue; the secondary "card" accent nods to Virginia Tech
(maroon in light, orange in dark).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f2f0ef` | `#071221` | Page background |
| `--text` | `#111` | `#f2f0ef` | Primary text |
| `--muted` | `#6b7280` | `#98a6b3` | Secondary text |
| `--accent` | `#0b5fff` | `#7ab7ff` | Links, CTAs, focus |
| `--card-accent` | `#861F41` | `#E5751F` | Tactile highlights (VT maroon/orange) |
| `--border` | rgba dark 6% | rgba light 6% | Hairlines |
| `--section-bg` / `--card-bg` | translucent white | translucent white | Surfaces |

Status colors are fixed across themes: in-progress `#3b82f6`, on-hold
`#eab308`, completed `#22c55e`, dropped `#ef4444`.

## Typography
- **Family:** Inter (variable). One family, weight for hierarchy.
- **Scale:** `h1` 84px (hero) → 48/40px responsive; section `h2` 28px;
  page titles 32px/800; body 15–16px; meta 12–13px.
- **Line-height:** 1.1 headings, 1.6 body.

## Spacing & radius
4px base scale (`--space-1`…`--space-8`). Radii: `--radius-sm` 8px (buttons),
`--radius-md` 16px (cards), `--radius-lg` 24px (project cards),
`--radius-pill` 999px (pills, chips).

## Motion
Motion is the brand. Reuse these easing tokens — don't hand-roll new curves.

| Token | Curve | Feel |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveals, content entrance |
| `--ease-smooth` | `cubic-bezier(0.25, 1, 0.5, 1)` | Hovers, transforms |
| `--ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Pop-in, playful overshoot |

Signature patterns: `reveal-flip` (perspective tilt-up on scroll),
`char-flip` (per-letter title reveal), `pill-wipe`, `pop-in`, the slot-scroller
label swap, and the holographic card tilt.

## Components (current)
`icon-btn`, `pill` / `pill-accent`, `slot-scroller`, project `arc-card`,
`content-card` (dev-log), `pill-tag` status chips, image carousel + modal,
scroll-progress bar, theme toggle, frosted nav.

## Open evolution ideas
Tracked, not yet done — decide via design review:
- A display weight/face for hero headings to sharpen hierarchy.
- Self-host Inter via Fontsource (drop the Google Fonts request).
- Co-locate project cover images in `src/` for Astro `<Image>` optimization.
- Tighten the spacing scale usage (replace remaining magic numbers with tokens).
