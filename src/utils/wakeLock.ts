let wakeLock: any = null;

export async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      // @ts-ignore
      wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLock.addEventListener?.('release', () => {
        wakeLock = null;
      });
    }
  } catch {
    // Not supported or permission denied — ignore
  }
}

export async function releaseWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release?.();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}
