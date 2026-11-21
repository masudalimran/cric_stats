const SOUND_KEY = 'cric-stats:sound-enabled'
const WAKE_KEY = 'cric-stats:keep-awake'

export function getSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setSoundEnabled(v: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(v))
  } catch {
    // ignore — storage unavailable (private mode, etc.)
  }
}

export function getKeepAwake(): boolean {
  try {
    return localStorage.getItem(WAKE_KEY) !== 'false'
  } catch {
    return true
  }
}

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

let sentinel: WakeLockSentinelLike | null = null

async function acquireWakeLock(): Promise<void> {
  const nav = navigator as NavigatorWithWakeLock
  if (!nav.wakeLock) return
  try {
    sentinel = await nav.wakeLock.request('screen')
  } catch {
    sentinel = null
  }
}

async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release()
  } catch {
    // ignore
  }
  sentinel = null
}

/** Persists the preference and immediately applies (or releases) the screen wake lock. */
export async function setKeepAwake(v: boolean): Promise<void> {
  try {
    localStorage.setItem(WAKE_KEY, String(v))
  } catch {
    // ignore
  }
  if (v) await acquireWakeLock()
  else await releaseWakeLock()
}

/** Call once at app startup: restores the wake lock on load, and re-acquires it when the tab regains focus
 * (browsers release it automatically whenever the tab is hidden). */
export function initWakeLockListener(): void {
  if (getKeepAwake()) void acquireWakeLock()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getKeepAwake() && !sentinel) {
      void acquireWakeLock()
    }
  })
}
