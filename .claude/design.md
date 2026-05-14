# Design System

## Personality
Professional, vivid, fast. Cerulean = brand anchor. Sandy orange = action. Steel blue-gray = neutral chrome. The sidebar is **always dark** — never inverts. Light mode uses a steel-tinted surface (`#F2FAFB`), not plain white.

---

## Fonts
Load both via `next/font/google` in `app/layout.tsx`. Apply as CSS variables.
- **UI:** Inter → `--font-sans`
- **Mono:** JetBrains Mono → `--font-mono` (task IDs, timestamps only)

## Type scale
| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Hero | 32px | 700 | -0.03em |
| H1 | 24px | 600 | -0.02em |
| H2 | 18px | 600 | -0.01em |
| H3 | 15px | 500 | 0 |
| Body | 14px | 400 | 0 |
| Small | 12px | 400 | 0 |
| Micro label | 11px | 500 | +0.06em + uppercase |
| Mono | 13px | 400 | 0 |

Rules: never weight 600+ outside headings. Never below 11px.

---

## Color system (register all in `tailwind.config.ts`)

### Cerulean (primary / brand)
```
cerulean-50:  #E8F8FD   badge backgrounds, subtle fills
cerulean-100: #B8ECFA   badge backgrounds, borders
cerulean-200: #66D9F5   badge borders, dividers
cerulean-400: #00B6EC   ★ brand — primary button, active states
cerulean-500: #009AC8   primary button hover
cerulean-600: #007DA4   icons, secondary text (light)
cerulean-700: #005F7D   sidebar active text, wordmark (light)
cerulean-800: #003D52   dark fills, sidebar avatar bg
cerulean-900: #061419   sidebar background (always dark)
```

### Orange (action)
```
orange-300: #FFC067   ★ Sandy amber — in-review status, warning fills
orange-400: #FFB853   secondary CTA bg
orange-500: #FA9836   Tangerine — hover secondary CTA
orange-600: #EA6400   ★ Spanish Orange — high priority, destructive, CTA text
```

### Steel (neutral chrome)
```
steel-50:  #F4F8FA   page background (light mode)
steel-100: #E2EDF2   column bg, secondary surfaces
steel-200: #C5DCE6   borders (default)
steel-300: #9DBFCF   borders (emphasis), low priority
steel-400: #7D99AA   ★ muted text, placeholder, chrome
steel-500: #5E7F91   secondary text
steel-800: #0F2530   primary text (light mode)
steel-900: #061419   deepest dark
```

### Highlights (sparingly)
```
#66F4FF   Aqua      — project dots on sidebar only, never as fill
#66C4FF   Sky blue  — focus rings, selected highlights
```

### Semantic
```
Urgent:      #EF4444   (red-500)
High:        #EA6400   (orange-600)
Medium:      #00B6EC   (cerulean-400)
Low:         #9DBFCF   (steel-300)
In progress: #00B6EC   (cerulean-400)
In review:   #FFC067   (orange-300)
Done:        #22C55E   (green-500)
```

---

## CSS variables (`globals.css`)

```css
:root {
  --bg:           #F2FAFB;
  --surface:      #FFFFFF;
  --surface-2:    #E8F4F8;
  --border:       #C5DCE6;
  --border-2:     #9DBFCF;
  --tx-1:         #0F2530;
  --tx-2:         #3E6070;
  --tx-3:         #7D99AA;
  --accent:       #00B6EC;
  --accent-hover: #009AC8;
  --accent-bg:    #E8F8FD;
  --accent-border:#B8ECFA;
  --focus-ring:   rgba(102, 196, 255, 0.18);
  --action:       #EA6400;
  --action-bg:    #FFF8EC;
  --action-border:#FFD98A;
  --radius:       8px;
  --radius-lg:    12px;
  --radius-xl:    16px;
}

.dark {
  --bg:           #061419;
  --surface:      #0F2530;
  --surface-2:    #1F3D4A;
  --border:       #2C5060;
  --border-2:     #3E6070;
  --tx-1:         #E2EDF2;
  --tx-2:         #7D99AA;
  --tx-3:         #3E6070;
  --accent:       #00B6EC;
  --accent-hover: #1AC4EF;
  --accent-bg:    rgba(0, 182, 236, 0.1);
  --accent-border:rgba(0, 182, 236, 0.2);
  --focus-ring:   rgba(102, 196, 255, 0.15);
  --action:       #FFC067;
  --action-bg:    rgba(255, 192, 103, 0.1);
  --action-border:rgba(255, 192, 103, 0.2);
}
```

---

## Layout & shell

- **Sidebar:** 240px, always `#061419` (hardcode in `Sidebar.tsx`, no CSS var). Collapsible to 56px icon rail.
- **Topbar:** 46px, `0.5px` bottom border (`var(--border)`), white surface.
- **Content area:** fills remaining, `var(--bg)`, scrolls independently.
- **Task detail panel:** 400px, slides from right, `200ms ease`.

---

## Component specs

**Primary button:** `bg #00B6EC`, `color #fff`, `hover #009AC8`, `7px 14px`, `8px radius`, `13px/500`

**Secondary button:** `bg var(--surface)`, `border 0.5px var(--border-2)`, `hover var(--surface-2)`

**Ghost button:** no border, `hover var(--surface-2)`

**Danger button:** `bg var(--action-bg)`, `color var(--action)`, `border 0.5px var(--action-border)`

**Task card:**
- `bg var(--surface)`, `border 0.5px var(--border)`, `border-radius 12px`
- Left border 3px by priority: Urgent `#EF4444` / High `#EA6400` / Medium `#00B6EC` / Low `#9DBFCF`
- Title 13px/500, meta 11px
- Drag state: `box-shadow: 0 8px 24px rgba(0,182,236,0.15)`, `scale(1.02)`

**Priority badges:**
- Urgent: `bg #FEF2F2 text #B91C1C border #FECACA`
- High: `bg #FFF8EC text #C25200 border #FFD98A`
- Medium: `bg #E8F8FD text #007DA4 border #B8ECFA`
- Low: `bg #E2EDF2 text #5E7F91 border #9DBFCF`

**Status badges:** pill + Tabler icon
- Todo: circle-dashed, steel-400
- In progress: progress icon, cerulean-400
- In review: eye icon, orange-300
- Done: circle-check, green

**Inputs:** `36px height`, `border 0.5px var(--border-2)`, `8px radius`. Focus: `border-color #00B6EC`, `box-shadow 0 0 0 3px var(--focus-ring)`.

**Board columns:** `bg var(--surface-2)`, `border 0.5px var(--border)`, `12px radius`. Min-width 240px, board scrolls horizontally.

**Sidebar nav:**
- Default: `color #7D99AA`
- Active: `bg rgba(0,182,236,0.12)`, `color #1AC4EF`
- Hover: `bg rgba(255,255,255,0.04)`
- Projects: 7px colored dot + name

---

## Spacing (multiples of 4px)
`4` inline badge gap · `8` related items · `12` compact padding · `16` standard padding · `24` between sections · `32` page sections

## Motion
All transitions `150ms ease`. Modals `200ms`. No bounce, spring, or elastic.

## Responsive design

**Philosophy:** Desktop-first. The full experience — keyboard shortcuts, dense layout, multi-pane views — is designed for desktop. Mobile gets all the same data and features, adapted for touch. Nothing is hidden on mobile.

**Breakpoint:** `768px`. Below this, the mobile layout kicks in. One breakpoint only — no intermediate tablet states.

### Mobile layout adaptations (< 768px)

**Sidebar → bottom navigation bar**
- Fixed bar at bottom of screen, 56px tall, `#061419` background (matches sidebar)
- 5 items: Dashboard · Projects · Inbox · My Day · Settings
- Active item: cerulean-400 icon + label. Inactive: steel-400
- Sidebar is completely hidden — replaced by bottom nav
- Project list accessible via "Projects" tab → full-screen list → tap to open project

**Task detail panel → full-screen overlay**
- Slides up from bottom (not from right) on mobile, `200ms ease`
- Full-screen with a topbar showing task title + back/close button
- No side-by-side with the list — task detail takes the whole screen

**Board view → list view default on mobile**
- Board view is still accessible via the view switcher tab
- Default view for all projects switches to list on mobile regardless of `default_view` setting
- Board on mobile scrolls horizontally — functional but not the primary mobile experience

**Quick capture**
- `Q` keyboard shortcut silently disabled on mobile
- Floating `+` button (bottom-right, 48px, cerulean, sits above the bottom nav) triggers quick capture
- Quick capture input opens as a bottom sheet, not a floating popup

**Command palette**
- `Cmd+K` silently disabled on mobile
- Accessible via a search icon in the topbar

**Drag and drop**
- @dnd-kit: use `PointerSensor` (handles both mouse and touch natively)
- Drag handle always visible on touch (not hover-only — hover doesn't exist on touch)
- Long-press to initiate drag on touch devices (activationConstraint: delay 250ms)

### Touch targets
All interactive elements on mobile must meet **minimum 44×44px tap target**. This applies even when the visual element is smaller — use padding to expand the tap area.

### Typography on mobile
Same scale as desktop. 13px on a phone is readable at normal viewing distance. Do not increase font sizes on mobile — the scale was chosen to work at arm's length.

### What does NOT change on mobile
- All colors, CSS variables, design tokens
- All data and features — nothing hidden, no mobile-only degradation
- Form layouts — inputs stack naturally, no changes needed
- Modals (shadcn Dialog) — already full-screen-ish on mobile by default
- Keyboard shortcuts — silently unavailable, not shown in mobile UI

---

## Strict don'ts
- No gradients
- No box shadows except drag state and focused modals
- No decorative illustrations — Tabler icons only
- Never pure `#FFFFFF` page bg in light mode — use `#F2FAFB`
- Never `#000000` for text — use `var(--tx-1)`
- Aqua/sky blue sparingly — dots, focus rings only
- Max 2 brand colors prominent simultaneously
- No font sizes below 11px
