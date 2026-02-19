"use client";

import * as React from "react";

export type MediaQueryOptions = {
  /**
   * Value returned during SSR (no window) and as the server snapshot for React.
   * Defaults to false.
   *
   * Pick a value that matches your server-rendered markup to avoid hydration mismatch.
   */
  defaultValue?: boolean;
};

/**
 * Returns false on the server and during the first client render,
 * then becomes true after hydration (useEffect).
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

export type ClientOnlyProps = {
  children: React.ReactNode;
  /**
   * Rendered before hydration. Useful to avoid hydration mismatch.
   * Defaults to null.
   */
  fallback?: React.ReactNode;
};

/**
 * Renders `fallback` until hydration completes, then renders `children`.
 *
 * Notes:
 * - Prefer CSS for purely responsive layout changes when possible.
 * - Use this when you must touch browser-only APIs or when markup must differ
 *   between server and client.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hydrated = useHydrated();
  return <>{hydrated ? children : fallback}</>;
}

function hasMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/**
 * Hydration-safe media query hook.
 *
 * - On the server, returns `defaultValue`.
 * - On the client, subscribes to matchMedia changes using useSyncExternalStore.
 */
export function useMediaQuery(query: string, options: MediaQueryOptions = {}): boolean {
  const { defaultValue = false } = options;

  const getServerSnapshot = React.useCallback(() => defaultValue, [defaultValue]);

  const getSnapshot = React.useCallback(() => {
    if (!hasMatchMedia()) return defaultValue;
    return window.matchMedia(query).matches;
  }, [query, defaultValue]);

  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (!hasMatchMedia()) return () => {};

      const mql = window.matchMedia(query);
      const handler = () => onStoreChange();

      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
      }

      (mql as any).addListener?.(handler);
      return () => {
        (mql as any).removeListener?.(handler);
      };
    },
    [query]
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function usePrefersReducedMotion(options?: MediaQueryOptions): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", options);
}

export type ColorScheme = "light" | "dark";

export function useColorScheme(options?: MediaQueryOptions): ColorScheme {
  const isDark = useMediaQuery("(prefers-color-scheme: dark)", options);
  return isDark ? "dark" : "light";
}
