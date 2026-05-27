/** Bunq-style disposable registry — tear down WebGL / listeners on route change. */
type Disposable = () => void;

declare global {
  interface Window {
    _visaiqDisposables?: Disposable[];
  }
}

export function registerDisposable(dispose: Disposable): Disposable {
  if (typeof window === "undefined") return dispose;
  window._visaiqDisposables = window._visaiqDisposables ?? [];
  window._visaiqDisposables.push(dispose);
  return () => {
    dispose();
    const list = window._visaiqDisposables;
    if (!list) return;
    const i = list.indexOf(dispose);
    if (i >= 0) list.splice(i, 1);
  };
}

export function disposeAll(): void {
  if (typeof window === "undefined") return;
  const list = window._visaiqDisposables ?? [];
  while (list.length) {
    const fn = list.pop();
    try {
      fn?.();
    } catch (e) {
      console.warn("Disposable cleanup failed:", e);
    }
  }
}
