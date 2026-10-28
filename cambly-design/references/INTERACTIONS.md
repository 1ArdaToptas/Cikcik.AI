# Interaction Reference

> Micro-interactions extracted from live DOM. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 3 | default, hover, focus |
| Role Button | 3 | default, hover, focus |
| Link | 3 | default, hover, focus |

## Transition System

These transition declarations were extracted from interactive elements:

```css
transition: all;
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `Claim`

**States:**

- Default: `../screens/states/button-1-default.png`
- Hover: `../screens/states/button-1-hover.png`
- Focus: `../screens/states/button-1-focus.png`

**On hover:**

```css
/* transition: all → */ transition: 0.2s;
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgb(0, 0, 0) 0px 0px 0px 4px;
/* outline: rgb(255, 255, 255) none 3px → */ outline: rgb(255, 255, 255) solid 2px;
```

**Transition:** `all`

### Button 2 — `Close promo code banner`

**States:**

- Default: `../screens/states/button-2-default.png`
- Hover: `../screens/states/button-2-hover.png`
- Focus: `../screens/states/button-2-focus.png`

**On hover:**

```css
/* transition: all → */ transition: 0.2s;
```

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgb(0, 0, 0) 0px 0px 0px 4px;
/* outline: rgb(5, 5, 0) none 3px → */ outline: rgb(255, 255, 255) solid 2px;
/* outline-color: rgb(5, 5, 0) → */ outline-color: rgb(255, 255, 255);
```

**Transition:** `all`

### Button 3 — `Manage`

**States:**

- Default: `../screens/states/button-3-default.png`
- Hover: `../screens/states/button-3-hover.png`
- Focus: `../screens/states/button-3-focus.png`

**On hover:**

```css
/* opacity: 1 → */ opacity: 0.9;
```

**On focus:**

```css
/* opacity: 1 → */ opacity: 0.9;
/* outline: rgb(255, 255, 255) none 3px → */ outline: rgb(25, 25, 25) solid 1px;
/* outline-color: rgb(255, 255, 255) → */ outline-color: rgb(25, 25, 25);
```

**Transition:** `all`

## Role Button Interactions

### Role Button 1 — `Ana, Brazil
Working for a US company`

**States:**

- Default: `../screens/states/role-button-1-default.png`
- Hover: `../screens/states/role-button-1-hover.png`
- Focus: `../screens/states/role-button-1-focus.png`

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgb(0, 0, 0) 0px 0px 0px 4px;
/* outline: rgb(0, 0, 0) none 3px → */ outline: rgb(255, 255, 255) solid 2px;
/* outline-color: rgb(0, 0, 0) → */ outline-color: rgb(255, 255, 255);
```

**Transition:** `all`

### Role Button 2 — `Mehmet, Turkey
Living abroad in Berlin`

**States:**

- Default: `../screens/states/role-button-2-default.png`
- Hover: `../screens/states/role-button-2-hover.png`
- Focus: `../screens/states/role-button-2-focus.png`

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgb(0, 0, 0) 0px 0px 0px 4px;
/* outline: rgb(0, 0, 0) none 3px → */ outline: rgb(255, 255, 255) solid 2px;
/* outline-color: rgb(0, 0, 0) → */ outline-color: rgb(255, 255, 255);
```

**Transition:** `all`

### Role Button 3 — `Wei, China
Working at UC Berkeley`

**States:**

- Default: `../screens/states/role-button-3-default.png`
- Hover: `../screens/states/role-button-3-hover.png`
- Focus: `../screens/states/role-button-3-focus.png`

**On focus:**

```css
/* box-shadow: none → */ box-shadow: rgb(0, 0, 0) 0px 0px 0px 4px;
/* outline: rgb(0, 0, 0) none 3px → */ outline: rgb(255, 255, 255) solid 2px;
/* outline-color: rgb(0, 0, 0) → */ outline-color: rgb(255, 255, 255);
```

**Transition:** `all`

## Link Interactions

### Link 1 — `Terms and conditions apply`

**States:**

- Default: `../screens/states/link-1-default.png`
- Hover: `../screens/states/link-1-hover.png`
- Focus: `../screens/states/link-1-focus.png`

**On focus:**

```css
/* outline: rgb(0, 0, 238) none 3px → */ outline: rgb(16, 16, 16) auto 1px;
/* outline-color: rgb(0, 0, 238) → */ outline-color: rgb(16, 16, 16);
```

**Transition:** `all`

### Link 2 — `a`

**States:**

- Default: `../screens/states/link-2-default.png`
- Hover: `../screens/states/link-2-hover.png`
- Focus: `../screens/states/link-2-focus.png`

**On focus:**

```css
/* outline: rgb(0, 0, 238) none 3px → */ outline: rgb(16, 16, 16) auto 1px;
/* outline-color: rgb(0, 0, 238) → */ outline-color: rgb(16, 16, 16);
```

**Transition:** `all`

### Link 3 — `Method`

**States:**

- Default: `../screens/states/link-3-default.png`
- Hover: `../screens/states/link-3-hover.png`
- Focus: `../screens/states/link-3-focus.png`

**On focus:**

```css
/* outline: rgb(0, 0, 238) none 3px → */ outline: rgb(16, 16, 16) auto 1px;
/* outline-color: rgb(0, 0, 238) → */ outline-color: rgb(16, 16, 16);
```

**Transition:** `all`

## Interaction Rules

- Hover effects use **opacity** changes, not color shifts
- Focus states use **outline** (not box-shadow) — always match the extracted focus ring
- Always respect `prefers-reduced-motion` — set all transitions to `0s` when enabled

