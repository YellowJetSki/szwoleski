export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  // On iOS Safari, SW is limited; still safe to try on compatible versions.
  try {
    const reg = await navigator.serviceWorker.register('/sw.ts', { scope: '/' });
    // Listen for updates
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available; could prompt user or auto-reload
          // location.reload();
        }
      });
    });
  } catch (err) {
    // noop: keep app functional even if SW fails
    console.error('SW registration failed', err);
  }
}
