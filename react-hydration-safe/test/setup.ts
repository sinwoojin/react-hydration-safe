import { vi } from "vitest";

// JSDOM doesn't ship with matchMedia by default.
// This mock returns a stable MediaQueryList per query and allows toggling matches.
type Listener = (event: MediaQueryListEvent) => void;

const registry = new Map<
  string,
  {
    mql: MediaQueryList;
    listeners: Set<Listener>;
    setMatches: (next: boolean) => void;
  }
>();

function getEntry(query: string) {
  const existing = registry.get(query);
  if (existing) return existing;

  let matches = false;
  const listeners = new Set<Listener>();

  const mql: MediaQueryList = {
    media: query,
    get matches() {
      return matches;
    },
    onchange: null,
    addEventListener: (_type: string, cb: EventListenerOrEventListenerObject) => {
      listeners.add(cb as unknown as Listener);
    },
    removeEventListener: (_type: string, cb: EventListenerOrEventListenerObject) => {
      listeners.delete(cb as unknown as Listener);
    },
    addListener: (cb: Listener) => listeners.add(cb),
    removeListener: (cb: Listener) => listeners.delete(cb),
    dispatchEvent: (event: Event) => {
      listeners.forEach((cb) => cb(event as MediaQueryListEvent));
      return true;
    },
  } as unknown as MediaQueryList;

  const setMatches = (next: boolean) => {
    matches = next;
    const evt = { matches: next, media: query } as unknown as MediaQueryListEvent;
    listeners.forEach((cb) => cb(evt));
  };

  const entry = { mql, listeners, setMatches };
  registry.set(query, entry);
  return entry;
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => getEntry(query).mql),
});

(globalThis as any).__setMqlMatches = (query: string, next: boolean) => {
  getEntry(query).setMatches(next);
};
