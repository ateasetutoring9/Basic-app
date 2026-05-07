# Design System

## Fonts

Loaded via `next/font/google` in `app/layout.tsx` and injected as CSS variables on `<html>`:

| Variable | Font | Weights | Usage |
|---|---|---|---|
| `--font-display` | Fraunces | 400, 500 | Headings, hero, brand name |
| `--font-body` | Inter | 400, 500, 600 | Body text, UI |

Tailwind utilities: `font-display`, `font-sans` (body is the default).

---

## Colour Tokens

Defined as CSS custom properties in `app/globals.css`. Exposed in Tailwind via `tailwind.config.ts`.

### Backgrounds

| Token | CSS Variable | Hex | Tailwind class |
|---|---|---|---|
| Page | `--bg-page` | `#FAFAF7` | `bg-page` |
| Panel | `--bg-panel` | `#F1EFE8` | `bg-panel` |
| Card | `--bg-card` | `#FFFFFF` | `bg-card` |

**Convention:** Alternate between `bg-page` and `bg-panel` for adjacent sections. Use `bg-card` for interactive cards and content containers.

### Accent (Eucalypt Green)

| Token | CSS Variable | Hex | Tailwind class |
|---|---|---|---|
| Accent | `--accent` | `#2D5F4C` | `bg-accent`, `text-accent`, `border-accent` |
| Accent hover | `--accent-hover` | `#244D3D` | `bg-accent-hover` |
| Accent soft | `--accent-soft` | `#E8EFEB` | `bg-accent-soft` |
| Text on accent | `--accent-text-on` | `#FAFAF7` | `text-[var(--accent-text-on)]` |

### Text

| Token | CSS Variable | Hex | Tailwind class |
|---|---|---|---|
| Primary | `--text-primary` | `#1A1A1A` | `text-fg` (legacy alias) |
| Secondary | `--text-secondary` | `#595956` | `text-muted` (legacy alias) |
| Tertiary | `--text-tertiary` | `#8B8B85` | `text-[var(--text-tertiary)]` |

### Semantic

| Token | CSS Variable | Tailwind class |
|---|---|---|
| Success | `--success` | `text-success`, `bg-success` |
| Success soft | `--success-soft` | `bg-success-soft` |
| Error | `--error` | `text-error`, `bg-error` |
| Error soft | `--error-soft` | `bg-error-soft` |

### Borders

| Token | CSS Variable | Hex | Tailwind class |
|---|---|---|---|
| Default | `--border` | `#E5E3DD` | `border-border` |
| Strong | `--border-strong` | `#D4D1C7` | `border-border-strong` |

---

## Type Scale

Defined as utility classes in `app/globals.css` (`@layer utilities`). All font sizes use `clamp()` for responsive scaling.

| Class | Usage | Size |
|---|---|---|
| `.text-hero` | H1 on landing page | `clamp(2.25rem, 5vw, 3.5rem)`, Fraunces 500 |
| `.text-page-title` | Page-level headings in app | `clamp(1.75rem, 3vw, 2.25rem)`, Fraunces 500 |
| `.text-section-title` | Landing page section H2s | `clamp(1.375rem, 2.5vw, 1.75rem)`, Fraunces 500 |
| `.text-subsection-title` | Card headings, sub-sections | `1.125rem`, Inter 500 |
| `.text-body` | Body copy | `1rem` / line-height 1.6 |
| `.text-lecture` | Lecture content | `1.0625rem` / line-height 1.7 |
| `.text-small` | Labels, captions, meta | `0.8125rem` |
| `.text-eyebrow` | Overline labels above headings | `0.6875rem`, uppercase, tracked, tertiary colour |

---

## Spacing & Layout

| Token | Value | Tailwind class |
|---|---|---|
| Max page width | `1100px` | `max-w-page` |
| Max reading width | `720px` | `max-w-reading` |

---

## Border Radius

| Token | CSS Variable | Value | Tailwind class |
|---|---|---|---|
| Small | `--radius-sm` | `6px` | `rounded-sm` |
| Medium | `--radius-md` | `10px` | `rounded-md` |
| Large | `--radius-lg` | `14px` | `rounded-lg` |

---

## Shadows

| Token | CSS Variable | Tailwind class | Usage |
|---|---|---|---|
| Hover | `--shadow-hover` | `shadow-hover` | Cards on hover |

---

## UI Primitives

All in `components/ui/`.

### `<Button>`

```tsx
<Button variant="primary" size="lg" href="/signup">
  Start learning
</Button>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |
| `href` | string | — renders as `<Link>` when provided |

### `<Card>`

```tsx
<Card variant="panel" interactive>
  Content
</Card>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` (white) \| `panel` (bg-panel) | `default` |
| `interactive` | boolean | `false` — adds hover shadow + lift |

### `<Eyebrow>`

```tsx
<Eyebrow>100% free · No credit card</Eyebrow>
```

Renders a `<p>` with `.text-eyebrow` — uppercase, tracked, tertiary colour. Accepts `className` for overrides.

### `<Input>`

Standard text input. Uses `border-border-strong`, `bg-card`, `rounded-md`, `focus:border-accent`.

---

## Landing Page Conventions

- All 15 components are React Server Components — no `"use client"`, no client JS.
- Use Lucide React for icons.
- Alternate sections: `bg-card border-y border-border` / plain `bg-page` / `bg-panel border-y border-border`.
- Accent sections (TrustStrip, FinalCTA): `bg-accent-soft border-y border-border`.
- All CTAs use `<Button href="/signup">` or `<Button href="/login">`.
- FAQ uses native `<details>`/`<summary>` with `group-open:rotate-180` chevron — no JS.
- Max width: `max-w-page` for wide grids, `max-w-reading` for text-heavy sections.

---

## Legacy Aliases

These aliases keep existing app pages (`/dashboard`, `/browse`, etc.) working without changes:

| Alias | Maps to |
|---|---|
| `text-fg` / `bg-fg` | `var(--text-primary)` |
| `text-muted` / `bg-muted` | `var(--text-secondary)` |
| `bg-primary` / `text-primary` | `var(--accent)` |
| `hover:bg-primary-hover` | `var(--accent-hover)` |
