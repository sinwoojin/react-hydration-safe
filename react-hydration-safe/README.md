# react-hydration-safe

Hydration-safe client primitives for **React 18** + **Next.js (App Router)**.

This package is intentionally small and focused:

- `useHydrated()` - `false` on server and first client render, then `true` after hydration
- `<ClientOnly />` - render `fallback` until hydrated
- `useMediaQuery()` - SSR-safe `matchMedia` hook (React 18 `useSyncExternalStore`)
- `usePrefersReducedMotion()`, `useColorScheme()`

## Why this exists

In Next.js App Router, it's easy to accidentally:

- access `window`/`localStorage` during render (SSR crash)
- produce server markup that differs from the first client render (hydration mismatch)
- import client-only hooks from a Server Component

This package pushes a simple rule: **import client primitives from `.../client`**.

## Install

```bash
npm i react-hydration-safe
# or
pnpm add react-hydration-safe
# or
yarn add react-hydration-safe
```

## Usage (Next.js App Router)

Put your UI that uses these hooks/components in a Client Component:

```tsx
"use client";

import { ClientOnly, useHydrated, useMediaQuery } from "react-hydration-safe/client";

export function Example() {
  const hydrated = useHydrated();
  const isDesktop = useMediaQuery("(min-width: 1024px)", { defaultValue: false });

  return (
    <ClientOnly fallback={<div style={{ height: 40 }} />}>
      <div>
        hydrated: {String(hydrated)} / desktop: {String(isDesktop)}
      </div>
    </ClientOnly>
  );
}
```

Tip: Importing from `react-hydration-safe/client` helps make the boundary explicit.  
If you try to import it from a Server Component, Next.js will prompt you to add `"use client"`.

## API

### `useHydrated(): boolean`

- `false` on the server
- `false` during the first client render
- `true` after hydration (`useEffect`)

Useful when you need to avoid hydration mismatch caused by client-only information.

### `<ClientOnly fallback?>`

```tsx
<ClientOnly fallback={<Skeleton />}>
  <RealClientUI />
</ClientOnly>
```

- Before hydration: renders fallback (default: `null`)
- After hydration: renders children

### `useMediaQuery(query, options?): boolean`

```tsx
const isDesktop = useMediaQuery("(min-width: 1024px)", { defaultValue: false });
```

- During SSR (and server snapshot for React): returns `options.defaultValue` (default: `false`)
- On client: uses `window.matchMedia(query)` and subscribes to changes
- Implementation uses `React.useSyncExternalStore` (React 18 friendly)

Options:

- `defaultValue?: boolean`

Choose a value that matches your server-rendered markup to avoid mismatch.

### `usePrefersReducedMotion(options?): boolean`

Convenience wrapper:

```tsx
const reduced = usePrefersReducedMotion({ defaultValue: false });
```

### `useColorScheme(options?): "light" | "dark"`

```tsx
// On the server, this returns "light" (because defaultValue defaults to false)
const scheme = useColorScheme({ defaultValue: false });

// If you want the server/default to be dark:
const scheme2 = useColorScheme({ defaultValue: true });
```

`useColorScheme` is a wrapper around `useMediaQuery("(prefers-color-scheme: dark)")`.  
So `defaultValue` means "isDark?" during SSR.

## When NOT to use this

- If you're only changing layout based on screen size, prefer CSS media queries first.
- `useMediaQuery` can cause a "flash" if your SSR markup doesn't match the client.
- If you need to load a whole component only on the client (for example, a heavy chart library), `next/dynamic(() => import(...), { ssr: false })` can be the better tool.

## Development

```bash
pnpm i
pnpm test
pnpm build
```

## License

MIT
