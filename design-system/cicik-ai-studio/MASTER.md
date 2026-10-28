# Design System Master File — Cicik AI Studio

> **LOGIC:** When building or refining a specific page, follow this Master Design System.
> **THEME LOCK (`temayı bozma`):** The existing **Cambly / Cicik Studio Warm Cream & High-Contrast Dark Theme** (`#FAF4EB` light / `#000000` & `#141414` dark, `#FFE733` Chick Yellow, `GT Super` display serif + `Garnett`/`Plus Jakarta Sans` sans + `IBM Plex Mono`) is strictly preserved.

---

**Project:** Cicik AI Studio (TTS & Whisper STT Studio)
**Generated via:** UI UX Pro Max (`search.py --design-system`)
**Design Dials:** Variance 6/10 (Balanced Editorial Studio) | Motion 6/10 (Purposeful Micro-Interactions) | Density 5/10 (Balanced Workstation)

---

## 1. Color Palette & Semantic Tokens (Preserved Theme)

| Role | Light Mode | Dark Mode | CSS Variable / Token |
|------|------------|-----------|----------------------|
| Canvas Background | `#FAF4EB` (Warm Cream) | `#000000` (Pure Studio Black) | `--bg-main` |
| Card Surface | `#FFFFFF` (Crisp White) | `#141414` (Elevated Charcoal) | `--card-bg` |
| Secondary / Sidebar Surface | `#F4ECE0` (Soft Sand) | `#1B1B1B` (Dark Slate) | `--sidebar-bg` |
| Elevated Hover Surface | `#EFE5D6` | `#222222` | `--surface-hover` |
| Primary Text | `#141413` (Contrast 16.8:1) | `#FFFFFF` (Contrast 21:1) | `--text-main` |
| Muted Text | `#4B463F` (Contrast 7.4:1) | `#A39E93` (Contrast 7.1:1) | `--text-muted` |
| Subtle Border | `#DFD7CE` | `#2C2A28` | `--border-subtle` |
| Brand Primary / CTA | `#FFE733` (Cicik Yellow) | `#FFE733` (Cicik Yellow) | `--color-chick-yellow` |
| Brand Warm Accent | `#FF9F43` (Amber Orange) | `#FF9F43` (Amber Orange) | `--color-chick-orange` |
| Brand Live Wave | `#38BDF8` (Chirp Sky) | `#38BDF8` (Chirp Sky) | `--color-chick-chirp` |
| Semantic Success | `#84CE64` | `#84CE64` | `--color-chick-success` |
| Semantic Danger | `#FF8071` | `#FF8071` | `--color-chick-red` |
| Focus Ring | `#FFE733` / `#FF9F43` | `#FFE733` | `--focus-ring` |

---

## 2. Typography Scale

- **Display / Headings (`--font-display`):** `'GT Super', Georgia, serif`
  - Hero Display: `clamp(2rem, 4vw, 3.5rem)`, `line-height: 1.12`, `letter-spacing: -0.02em`
  - Page Title (H1): `clamp(1.75rem, 3vw, 2.35rem)`, `line-height: 1.18`
  - Section Title (H2): `1.35rem – 1.5rem`, `line-height: 1.25`
  - Card Title (H3): `1.05rem – 1.15rem`, `line-height: 1.35`
- **Body / UI (`--font-sans`):** `'Garnett', 'Plus Jakarta Sans', system-ui, sans-serif`
  - Body Large: `1rem` (`16px`), `line-height: 1.65`
  - Body Default: `0.875rem` (`14px`), `line-height: 1.55`
  - UI Label / Kicker: `0.6875rem` (`11px`), uppercase, `letter-spacing: 0.16em`, `font-weight: 700`
- **Technical / Timestamps (`--font-mono`):** `'IBM Plex Mono', ui-monospace, monospace`
  - Used for durations (`00:14`), character counters (`131 / 100000`), speed multipliers (`1.00×`), and format badges (`WAV`, `MP3`, `SRT`).

---

## 3. Layout, Spacing & Responsive Breakpoints

- **Container:** `max-w-7xl` (`1280px`) centered with adaptive horizontal padding (`px-4 sm:px-6 lg:px-10`).
- **Breakpoints Verified:** `375px` (Small Mobile), `430px` (Large Mobile), `768px` (Tablet), `1024px` (Laptop), `1440px` (Desktop), `1920px` (Wide).
- **Navigation Architecture:**
  - Desktop (`lg:`): Sticky top bar with brand identity on left, pill navigation in center, live engine status + language (`TR | EN`) + theme toggle on right.
  - Mobile/Tablet (`<lg`): Clean top bar with brand + controls and a dedicated horizontally scrollable / wrap-safe navigation strip below so zero items overflow at `375px`.

---

## 4. Motion & Micro-Interactions (`prefers-reduced-motion` Safe)

- **Entrance Stagger:** `.animate-enter` (`350ms cubic-bezier(0.16, 1, 0.3, 1)`) with `.stagger-1` to `.stagger-4` (`50ms` increments).
- **Card Elevation:** `.cambly-card-interactive` lifts `-2px` with warm border highlight on hover (`200ms cubic-bezier(0.22, 1, 0.36, 1)`).
- **Audio Waveforms:** `.animate-wave-bar` & `.animate-sound-wave` for active synthesis and playback feedback.
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables all infinite decorative animations and collapses transitions to instant state changes.

---

## 5. UI UX Pro Max Pre-Delivery Checklist

- [x] No emojis used as structural UI icons (all replaced with Lucide vector icons)
- [x] `cursor-pointer` on all interactive controls
- [x] Visible `:focus-visible` ring on all buttons, inputs, links, and modal controls
- [x] Contrast >= 4.5:1 verified in both Light (`#FAF4EB`) and Dark (`#000000`) themes
- [x] `prefers-reduced-motion` respected globally
- [x] Responsive across `375px`, `430px`, `768px`, `1024px`, `1440px` without horizontal overflow
