# Animation Reference

> Cinematic motion design extracted from live DOM. Follow these specs exactly to recreate the experience.

## Motion Technology Stack

Pure CSS animations — no external animation libraries detected.

## Scroll Journey

The page is **9.598px** tall. Each frame below shows what the user sees at that scroll depth.

> **Use these screenshots to understand WHAT animates, WHEN it animates, and HOW it moves.**

### 0% — Top / Hero
Scroll position: 0px

![Scroll 0%](../screens/scroll/scroll-000.png)

### 17% — Opening Section
Scroll position: 1.479px

![Scroll 17%](../screens/scroll/scroll-017.png)

### 33% — First Feature Section
Scroll position: 2.870px

![Scroll 33%](../screens/scroll/scroll-033.png)

### 50% — Mid-Page
Scroll position: 4.349px

![Scroll 50%](../screens/scroll/scroll-050.png)

### 67% — Lower Content
Scroll position: 5.828px

![Scroll 67%](../screens/scroll/scroll-067.png)

### 83% — Near Footer
Scroll position: 7.219px

![Scroll 83%](../screens/scroll/scroll-083.png)

### 100% — Bottom / Footer
Scroll position: 8.698px

![Scroll 100%](../screens/scroll/scroll-100.png)

## Video Elements

| # | Role | Autoplay | Loop | Muted | Size | First Frame |
|---|------|----------|------|-------|------|-------------|
| 1 | background | ✓ | ✓ | ✓ | 1440×679 | [view](../screens/scroll/video-1-frame.png) |
| 2 | background | ✓ | — | ✓ | 960×540 | — |

**Video 1 first frame:**

![Video 1 Frame](../screens/scroll/video-1-frame.png)

- **Source:** `https://camblycdnimages.camblycdn.com/brandvideo/480x500-Video_02_v02_241024.mp4`
- **Source:** `https://camblycdnimages.camblycdn.com/brandvideo/progress_not_perfection_video_mobile.webm`

## Scroll Animation Patterns

| Pattern | Library | Element Count | Duration | Delay | Easing |
|---------|---------|---------------|----------|-------|--------|
| parallax / sticky scroll | CSS | 1 | — | — | — |

### CSS Implementation

## Global Transition Declarations

These `transition` values were extracted from CSS rules across the site:

```css
transition: 0.1s;
transition: 300ms ease-in;
transition: 0.2s ease-in;
transition: 0.4s;
transition: 150ms ease-in;
transition: 0.2s;
transition: 0.25s ease-out;
transition: 0.1s ease-in;
```

## How to Recreate This Motion Design

### Step 2 — Scroll-Reveal Pattern

Elements that animate into view follow this pattern:

```css
/* Initial hidden state */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 3 — Key Motion Principles

- **Video backgrounds** — use `<video autoplay loop muted playsinline>` for background videos. Always include a poster image fallback
- **Duration scale:** `0.1s` · `300ms` · `0.2s` · `0.4s` · `150ms` — use these values, never invent new durations
- **Always add** `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

### Step 4 — Scroll Journey Reference

Match what happens at each scroll position:

- **0%** (`0px`) → `screens/scroll/scroll-000.png`
- **17%** (`1479px`) → `screens/scroll/scroll-017.png`
- **33%** (`2870px`) → `screens/scroll/scroll-033.png`
- **50%** (`4349px`) → `screens/scroll/scroll-050.png`
- **67%** (`5828px`) → `screens/scroll/scroll-067.png`
- **83%** (`7219px`) → `screens/scroll/scroll-083.png`
- **100%** (`8698px`) → `screens/scroll/scroll-100.png`

