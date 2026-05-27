/** View Transitions API wrapper (Astro-like page transitions in Vite). */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function withViewTransition(callback: () => void | Promise<void>): void {
  if (!supportsViewTransitions()) {
    void callback();
    return;
  }
  document.startViewTransition(async () => {
    await callback();
  });
}
