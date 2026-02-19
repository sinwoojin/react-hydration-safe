import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ClientOnly, useHydrated, useMediaQuery } from "../src/client";

describe("useHydrated", () => {
  test("becomes true after mount", async () => {
    const { result } = renderHook(() => useHydrated());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});

describe("ClientOnly", () => {
  test("renders fallback on the server", () => {
    const html = ReactDOMServer.renderToString(
      <ClientOnly fallback={<span data-testid="fallback">fallback</span>}>
        <span data-testid="content">content</span>
      </ClientOnly>
    );

    expect(html).toContain("fallback");
    expect(html).not.toContain("content");
  });

  test("renders children on the client after hydration", async () => {
    render(
      <ClientOnly fallback={<span data-testid="fallback">fallback</span>}>
        <span data-testid="content">content</span>
      </ClientOnly>
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeTruthy();
    });
  });
});

describe("useMediaQuery", () => {
  test("returns current matches and updates on change", async () => {
    const query = "(min-width: 1024px)";

    (globalThis as any).__setMqlMatches(query, false);

    const { result } = renderHook(() => useMediaQuery(query, { defaultValue: false }));
    expect(result.current).toBe(false);

    act(() => {
      (globalThis as any).__setMqlMatches(query, true);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  test("falls back to defaultValue if matchMedia is unavailable", () => {
    const original = window.matchMedia;
    (window as any).matchMedia = undefined;

    const { result } = renderHook(() => useMediaQuery("(min-width: 1px)", { defaultValue: true }));
    expect(result.current).toBe(true);

    window.matchMedia = original;
  });
});
