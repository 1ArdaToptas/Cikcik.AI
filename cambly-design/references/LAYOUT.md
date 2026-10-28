# Layout Reference

> Auto-extracted from live DOM. Use this to understand how the site is structured spatially.

## Spacing System

**Base grid:** 4px

**Scale:** `2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 30, 32, 36, 40, 44` px

| Spacing | Semantic Use |
|---------|-------------|
| 4px | Tight — within a component |
| 8px | Medium — between sibling items |
| 16px | Wide — between sections |
| 32px | Vast — major section breaks |

## Flex Layouts

| Element | Direction | Justify | Align | Gap | Children |
|---------|-----------|---------|-------|-----|----------|
| `div._box_xcjsm_1._column_xcjsm_213` | column | — | — | 48px | 5 |
| `nav._box_xcjsm_1._alignItemscenter_xcjsm_18` | row | space-between | center | — | 2 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | row | — | center | — | 2 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | column | — | center | — | 1 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | column | center | center | 40px | 3 |
| `div._box_xcjsm_1._column_xcjsm_213` | row | — | — | 40px | 1 |
| `div._box_xcjsm_1._column_xcjsm_213` | row | space-between | — | 40px | 5 |
| `div._box_xcjsm_1._alignItemsend_xcjsm_26` | row | space-between | end | 16px | 2 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | row | center | center | — | 2 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | row | — | center | 40px | 2 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | row | — | center | 8px | 4 |
| `div._box_xcjsm_1._blackBackgroundColor_1xef3_237` | row | center | — | — | 1 |
| `div._box_xcjsm_1._yellow700BackgroundColor_1xef3_417` | row | center | — | — | 1 |
| `div._box_xcjsm_1._column_xcjsm_213` | column | — | — | 24px | 3 |
| `div._box_xcjsm_1._alignItemscenter_xcjsm_18` | column | — | center | 48px | 2 |

## Structural Containers

### `<footer>` (`footer._box_xcjsm_1._blackBackgroundColor_1xef3_237`)

```
display:          block
padding:          48px
children:         1
```

### `<nav>` (`nav._box_xcjsm_1._alignItemscenter_xcjsm_18`)

```
display:          flex
flex-direction:   row
justify-content:  space-between
align-items:      center
padding:          0px 24px
children:         2
```

## Layout Rules

- **Container max-width:** `1440px` — always center with `margin: auto`
- Primary layout system: **Flexbox**
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

