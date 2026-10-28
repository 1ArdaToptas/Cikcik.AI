---
name: radix-ui
description: Build accessible, unstyled, composable UI components using Radix UI Primitives (radix-ui/primitives). Use when implementing dialogs, modal overlays, dropdown menus, context menus, tooltips, popovers, tabs, accordions, select dropdowns, sliders, switches, radio groups, scroll areas, and accessible WAI-ARIA compliant design patterns with the asChild Slot pattern.
argument-hint: "[primitive name, e.g. dialog, dropdown-menu, popover, select, tabs]"
license: MIT
metadata:
  author: Radix UI / WorkOS (@radix-ui)
  version: "1.0.0"
  repository: "https://github.com/radix-ui/primitives"
  documentation: "https://www.radix-ui.com/primitives/docs/overview/introduction"
---

# Radix UI Primitives Skill

Expert reference and implementation guide for building robust, fully accessible, and unstyled React components using **Radix UI Primitives**.

---

## 🎯 What Are Radix Primitives?

Radix Primitives is a low-level UI component library focused on:
- **Accessibility by Default:** Adheres strictly to WAI-ARIA design patterns, with automatic ARIA attributes, keyboard navigation, focus trapping, and screen-reader announcements.
- **Unstyled & Headless:** Completely free of opinions on CSS, design tokens, or themes. 100% styled via Tailwind CSS or CSS Modules.
- **Composable Architecture:** Components are broken down into logical sub-parts (`Root`, `Trigger`, `Portal`, `Content`, `Overlay`, `Item`, `Close`).
- **The `asChild` Slot Pattern:** Renders behavior onto your existing custom element without injecting extra wrapping `<div>` DOM nodes.

---

## 📦 Packages & Core Installation

Radix Primitives are modular packages published under `@radix-ui`:

```bash
# Common Overlays & Menus
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-tooltip

# Navigation & Panels
npm install @radix-ui/react-tabs @radix-ui/react-accordion @radix-ui/react-navigation-menu

# Form Controls
npm install @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-slider @radix-ui/react-radio-group

# Layout & Feedback
npm install @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator @radix-ui/react-toast

# Composition Primitives
npm install @radix-ui/react-slot
```

---

## 🧩 Architectural Patterns & Code Examples

### 1. Accessible Modal Dialog (`@radix-ui/react-dialog`)
Features focus locking, ESC to dismiss, backdrop blur, and body scroll lock:

```tsx
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Animated backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Centered Modal Content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <Dialog.Title className="text-lg font-bold text-[var(--text-main)]">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Kapat"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="py-4 text-sm text-[var(--text-muted)] leading-relaxed">
            {description}
          </Dialog.Description>

          <div className="flex justify-end gap-2 pt-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                İptal
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-chick-yellow px-4 py-2 text-xs font-bold text-black shadow-sm transition hover:scale-102"
            >
              Onayla
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 2. Context Menu & Dropdown Menu (`@radix-ui/react-dropdown-menu`)
Features roving tabindex, keyboard shortcuts, submenus, and radio/checkbox groups:

```tsx
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";

export function LanguageDropdown({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (val: string) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3 py-1.5 text-xs font-bold text-[var(--text-main)]">
          Dil: {selected.toUpperCase()}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-44 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-1.5 shadow-xl animate-in fade-in-80"
        >
          <DropdownMenu.Label className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Diller
          </DropdownMenu.Label>

          {["tr", "en", "de", "fr"].map((lang) => (
            <DropdownMenu.Item
              key={lang}
              onClick={() => onSelect(lang)}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--text-main)] cursor-pointer outline-none hover:bg-chick-yellow/20 hover:text-chick-yellow data-[highlighted]:bg-chick-yellow/20"
            >
              <span>{lang.toUpperCase()}</span>
              {selected === lang && <Check className="size-3.5 text-chick-yellow" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

### 3. The `asChild` Pattern (Composition Superpower)
Instead of rendering nested buttons or divs, `asChild` merges event handlers, ref, and props directly onto the child component:

```tsx
<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <a href="/docs" className="inline-flex items-center">
      Belgeler
    </a>
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content className="rounded bg-black px-2 py-1 text-xs text-white">
      Kullanım kılavuzunu inceleyin
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
```

---

## 💡 Best Practices

1. **Always Use `Portal` for Overlays:**
   Prevents z-index stacking context bugs and overflow clipping from parent elements.
2. **Animation States:**
   Target `data-[state=open]` and `data-[state=closed]` for CSS keyframe animations.
3. **Accessibility Verification:**
   Ensure every `Dialog.Content` contains both `Dialog.Title` and `Dialog.Description` (or explicitly set `aria-describedby={undefined}` if no description is needed).
