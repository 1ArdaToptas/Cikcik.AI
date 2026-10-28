---
name: react-bits
description: Interactive, animated, and customizable React components from React Bits (DavidHDev/react-bits). Use when designing creative landing pages, hero sections, text animations (BlurText, SplitText, DecryptedText, TrueFocus, ShinyText), interactive backgrounds (Aurora, Hyperspeed, Ballpit, Waves, GridMotion, Dither), micro-interactions, specialized cards (TiltedCard, SpotlightCard, PixelCard, Lanyard 3D), and cursor effects (BlobCursor, ClickSpark).
argument-hint: "[component, effect, or animation name]"
license: MIT
metadata:
  author: David Haz (@DavidHDev)
  version: "1.0.0"
  repository: "https://github.com/DavidHDev/react-bits"
  documentation: "https://reactbits.dev"
---

# React Bits Component & Animation Skill

Comprehensive expert guide for integrating, customizing, and building creative UI experiences using **React Bits**—a curated collection of 60+ lightweight, animated, and interactive React components built with Tailwind CSS, Framer Motion, and WebGL/Canvas.

---

## 🌟 Overview & Core Stack

React Bits components follow a copy-paste & registry distribution model similar to shadcn/ui:
- **Zero Heavy Bundles:** Only copy the exact component code needed.
- **TypeScript First:** Complete prop types and generics.
- **Styling:** Tailwind CSS (compatible with v3 and v4).
- **Animation Primitives:** Framer Motion (`motion/react` or `framer-motion`) and native CSS/Canvas/Three.js where applicable.

---

## 📦 Installation & Setup

### 1. Dependencies
React Bits components commonly depend on `framer-motion` (or `motion`), `clsx`, and `tailwind-merge`:

```bash
npm install framer-motion clsx tailwind-merge lucide-react
```

### 2. Utility Helper (`cn`)
Ensure `src/lib/utils.ts` exists:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. Adding via shadcn Registry Protocol
React Bits supports direct integration via shadcn CLI:
```bash
npx shadcn@latest add "https://reactbits.dev/r/[component-name]"
```

---

## 🎨 Component Catalog & Best Practices

### 1. Text Animations (Typography in Motion)
Ideal for hero titles, badges, section headers, and micro-copy:

* **Blur Text (`BlurText`):** Words or characters animate smoothly from blurred opacity into crisp focus.
  ```tsx
  import { BlurText } from "@/components/react-bits/BlurText";

  <BlurText
    text="Yapay Zekâ ile Geleceği Keşfedin"
    delay={150}
    animateBy="words"
    direction="top"
    className="text-4xl font-bold text-center"
  />
  ```
* **Decrypted Text (`DecryptedText`):** Cyberpunk / matrix style random glyph scrambling that resolves into real text.
* **True Focus (`TrueFocus`):** Hover or cyclical lens focus rectangle highlighting specific words while blurring the rest.
* **Shiny Text (`ShinyText`):** Subtle metallic light-sheen sweep across headings.
* **Split Text (`SplitText`):** Staggered character / word rise with customizable spring damping.
* **Rotating Words / Flip Text:** Dynamic switching between action verbs.

### 2. Backgrounds & Atmospheric Visuals
High-performance background canvases with responsive fallback:

* **Aurora / Soft Aurora (`Aurora`):** Flowing organic gradient fluid waves behind dark or light glass cards.
* **Hyperspeed (`Hyperspeed`):** Star-trek style warp drive light streaks for high-energy tech hero sections.
* **Ballpit (`Ballpit`):** Interactive physics-based 3D bouncing spheres driven by canvas and pointer velocity.
* **Waves / Plasma (`Waves`):** Subtle wave line mesh responding to scroll and mouse coordinates.
* **Dither / Grainient (`Dither`):** Retro lo-fi grainy shader textures giving depth without loading heavy video assets.
* **Dot Grid / Grid Motion (`DotGrid`):** Perspective 3D grid movements.

### 3. Interactive Cards & UI Elements
* **Tilted Card (`TiltedCard`):** 3D perspective tilt reacting to cursor coordinates with smooth glare overlay.
  ```tsx
  import { TiltedCard } from "@/components/react-bits/TiltedCard";

  <TiltedCard
    imageSrc="/preview.png"
    altText="Proje Önizleme"
    captionText="Ses Analiz Stüdyosu"
    containerHeight="320px"
    containerWidth="100%"
    rotateAmplitude={12}
    scaleOnHover={1.05}
    showMobileWarning={false}
  />
  ```
* **Spotlight Card (`SpotlightCard`):** Subtle radial glow tracking the cursor across card borders (perfect for feature bento grids).
* **Pixel Card (`PixelCard`):** Pixelated particle explosion on hover.
* **Infinite Menu / Dock (`InfiniteMenu` / `Dock`):** macOS-style dock magnification or continuous loop wheel menus.
* **Lanyard (`Lanyard`):** 3D swinging ID badge reacting to physics and drag forces.

### 4. Micro-Interactions & Cursor Effects
* **Click Spark (`ClickSpark`):** Burst of geometric sparks upon mouse click.
* **Blob Cursor (`BlobCursor`):** Soft trailing fluid dot following pointer with spring inertia.
* **Flying Button / Specular Button:** Shimmer and physics button presses.

---

## 🛠️ Implementation Guidelines

1. **Accessibility & Reduced Motion:**
   Always wrap heavy spring animations in `prefers-reduced-motion` checks:
   ```tsx
   const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   ```
2. **GPU Acceleration:**
   Use `transform-gpu`, `will-change-transform`, and avoid animating `top`, `left`, `margin`, or `padding`. Animate only `transform` (`x`, `y`, `scale`, `rotate`) and `opacity`.
3. **Responsive Degradation:**
   On mobile screens (< 768px), disable heavy 3D canvas backgrounds (`Ballpit`, `Hyperspeed`) or reduce particle counts by 70% to conserve battery and CPU.
