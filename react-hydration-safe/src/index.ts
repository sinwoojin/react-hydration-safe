/**
 * Server-safe entry.
 *
 * In Next.js (App Router), prefer importing hooks/components from:
 *   `react-hydration-safe/client`
 *
 * This root entry intentionally exports only types to avoid accidentally
 * pulling client-only code into Server Components.
 */

export type { MediaQueryOptions } from "./client";
