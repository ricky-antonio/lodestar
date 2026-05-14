# Code Standards

## Non-negotiable rules
- TypeScript strict mode — no `any`
- All Supabase queries in `lib/` helpers — never raw in components
- Always specify columns — never `select *`
- Optimistic UI on all mutations with rollback on failure
- RLS enforces access — never filter by `user_id` in app code
- No `console.log` in final code
- Sanitize all user HTML with `DOMPurify`
- Every external API call (Supabase, Anthropic) in try/catch with user-facing fallback
- Components under ~150 lines — split if larger
- Server state and UI state must be clearly separated

## Comments
Only add a comment when the WHY is non-obvious: hidden constraint, subtle invariant, bug workaround. If removing it wouldn't confuse a future reader, don't write it. Never describe WHAT the code does.

## Error handling
Use this shape everywhere:
```ts
interface AppError {
  message: string  // shown to user
  code: string     // e.g. 'TASK_NOT_FOUND'
  field?: string   // form validation only
}
```

No error handling for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).

## Performance
- `@tanstack/react-virtual` for any list >50 items
- `next/dynamic` for: TimelineView, CalendarView, all Chart.js, CommandPalette
- Never `select *` from Supabase

## Mobile

- One breakpoint: `768px`. Use Tailwind `md:` prefix for desktop styles, base styles for mobile.
- All interactive elements must have a minimum 44×44px tap target on mobile — use padding to expand if the visual is smaller
- Never use hover-only affordances as the only way to trigger something — on mobile there is no hover. Drag handles, action buttons, and contextual controls must be reachable without hover
- Use `PointerSensor` from @dnd-kit — handles mouse and touch. Set `activationConstraint: { delay: 250, tolerance: 5 }` for touch (prevents accidental drags while scrolling)
- Bottom nav is the mobile sidebar — built as a separate component, not a modified Sidebar
- Check every new component at `375px` width before marking it done

## Accessibility
- All interactive elements keyboard-accessible
- All dropdowns/modals close on Escape
- Modals trap focus (shadcn Dialog handles this)
- @dnd-kit keyboard alternative enabled
- Icon-only buttons need `aria-label`
- Priority/status never conveyed by color alone — always text + icon
- Inputs always have `<label>` — never placeholder-only
