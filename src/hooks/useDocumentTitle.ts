import { useEffect } from 'react';

/**
 * Sets `document.title` (the browser tab title) while the component is mounted.
 *
 * Used to distinguish the admin screens from the player-facing form in an SPA,
 * where the static `<title>` in index.html would otherwise stay the same across
 * all routes. Re-runs whenever the resolved title changes (e.g. on language
 * switch), so pass an already-translated string.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
}
