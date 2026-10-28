---
name: magic-ui
description: Build cutting-edge animated UI components with Magic UI (magicuidesign/magicui). Use when designing high-converting SaaS landing pages, animated bento grids, marquee carousels, globe 3D visualizers, shimmer buttons, animated beams, neon gradient cards, particle effects, meteors, border beam gradients, device mockups (Safari, iPhone, Android), and motion-rich design engineer components.
argument-hint: "[component name, e.g. bento-grid, marquee, globe, shimmer-button, animated-beam, particles]"
license: MIT
metadata:
  author: Magic UI (@magicuidesign)
  version: "1.0.0"
  repository: "https://github.com/magicuidesign/magicui"
  documentation: "https://magicui.design/docs"
---

# Magic UI Component & Motion Skill

Expert reference and implementation guide for crafting high-production-value animated interfaces using **Magic UI**—the premier open-source UI collection for design engineers built with React, TypeScript, Tailwind CSS, and Motion (Framer Motion).

---

## 🚀 Overview & Principles

Magic UI components live directly in your project (like shadcn/ui) rather than behind a black-box NPM dependency:
- **Full Source Ownership:** Modify any animation curve, particle count, or color scheme directly in `components/magicui/`.
- **Works Alongside shadcn/ui:** Seamless integration with existing shadcn tokens, radix primitives, and Tailwind theme classes.
- **Micro-Animations & Visual Delights:** Crafted specifically for high-impact landing pages, hero showcases, and SaaS dashboards.

---

## 📦 Setup & CLI Workflow

### 1. Initialize shadcn (Prerequisite)
If not already initialized in your project:
```bash
npx shadcn@latest init
```

### 2. Adding Components via shadcn CLI
Magic UI components are hosted in the official registry:

```bash
# High-Impact Hero & Background Effects
npx shadcn@latest add @magicui/particles
npx shadcn@latest add @magicui/meteors
npx shadcn@latest add @magicui/border-beam
npx shadcn@latest add @magicui/interactive-grid-pattern

# Interactive Data & Layout
npx shadcn@latest add @magicui/bento-grid
npx shadcn@latest add @magicui/marquee
npx shadcn@latest add @magicui/animated-beam
npx shadcn@latest add @magicui/orbiting-circles
npx shadcn@latest add @magicui/globe

# Buttons & Micro-Elements
npx shadcn@latest add @magicui/shimmer-button
npx shadcn@latest add @magicui/neon-gradient-card
npx shadcn@latest add @magicui/animated-subscribe-button
npx shadcn@latest add @magicui/safari
```

### 3. Dependencies
Components typically use:
```bash
npm install framer-motion clsx tailwind-merge lucide-react
```

---

## 🎨 Essential Component Blueprints

### 1. Border Beam (`BorderBeam`)
Draws a luminous, infinite moving laser border beam along the perimeter of any card or container:

```tsx
import { BorderBeam } from "@/components/magicui/border-beam";

export function PremiumFeatureCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 shadow-xl">
      <h3 className="text-xl font-bold text-[var(--text-main)]">Sinirsel Ses Klonlama</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        5 saniyelik ses kaydıyla stüdyo kalitesinde gerçekçi klonlama yapın.
      </p>

      {/* Radiant moving laser border */}
      <BorderBeam size={250} duration={12} delay={9} colorFrom="#fbbf24" colorTo="#f59e0b" />
    </div>
  );
}
```

### 2. Infinite Continuous Marquee (`Marquee`)
Smooth, zero-jank horizontal or vertical looping marquee for client logos, reviews, and badges:

```tsx
import { Marquee } from "@/components/magicui/marquee";

export function VoiceShowcase() {
  const voices = ["Deniz (Türkçe)", "Ahmet (Haber)", "Elif (Doğal)", "James (EN)", "Sophie (FR)"];

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
      <Marquee pauseOnHover className="[--duration:25s]">
        {voices.map((name) => (
          <div
            key={name}
            className="mx-3 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-4 py-2 text-xs font-bold text-[var(--text-main)] shadow-sm"
          >
            🎙️ {name}
          </div>
        ))}
      </Marquee>
      {/* Edge gradient masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[var(--bg-main)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[var(--bg-main)]" />
    </div>
  );
}
```

### 3. Shimmer Button (`ShimmerButton`)
High-conversion CTA button with rotating light sheen highlight:

```tsx
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Sparkles } from "lucide-react";

export function MainCTA() {
  return (
    <ShimmerButton
      className="shadow-2xl"
      shimmerColor="#fbbf24"
      shimmerSize="0.1em"
      shimmerDuration="2s"
      background="rgba(22, 23, 27, 1)"
    >
      <span className="flex items-center gap-2 text-center text-sm font-semibold text-white">
        <Sparkles className="size-4 text-amber-400" />
        Hemen Ücretsiz Deneyin
      </span>
    </ShimmerButton>
  );
}
```

### 4. Interactive Bento Grid (`BentoGrid`, `BentoCard`)
Apple/Linear style asymmetrical responsive feature grid:

```tsx
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import { Mic, FileText, Globe2, Cpu } from "lucide-react";

const features = [
  {
    Icon: Mic,
    name: "100.000 Karakter TTS",
    description: "Kitap ve makalelerinizi tek seferde doğal sesle okutun.",
    href: "#",
    cta: "İncele",
    className: "col-span-3 lg:col-span-2",
  },
  {
    Icon: Globe2,
    name: "Whisper STT & Çeviri",
    description: "YouTube videolarını ve sesleri anında metne ve 8 dile çevirin.",
    href: "#",
    cta: "Keşfet",
    className: "col-span-3 lg:col-span-1",
  },
];

export function FeatureSection() {
  return (
    <BentoGrid className="max-w-5xl mx-auto">
      {features.map((feature, idx) => (
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  );
}
```

### 5. Floating Particle Canvas (`Particles`)
Canvas-driven lightweight floating dust/star particles responding to scroll and mouse coordinates without lag.

---

## ⚡ Performance & Optimization Tips

1. **Avoid Layout Shift with Canvas Elements:**
   Always assign fixed aspect-ratio containers (`relative w-full h-[350px]`) for `Globe`, `Particles`, and `InteractiveGridPattern`.
2. **GPU Acceleration (`transform-gpu`):**
   Combine `transform-gpu` and `will-change: transform` on continuous animations (`Marquee`, `BorderBeam`, `Meteors`).
3. **Dark / Light Theme Harmony:**
   Use CSS variables (e.g. `bg-[var(--card-bg)]` and `border-[var(--border-subtle)]`) so Magic UI components adapt automatically to dark stüdyo and light themes.
