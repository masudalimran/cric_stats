import confetti from 'canvas-confetti'
import { getSoundEnabled } from './prefs'

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function beep(freqs: number[], duration = 0.12) {
  if (!getSoundEnabled()) return
  const ctx = getCtx()
  if (!ctx) return
  let t = ctx.currentTime
  for (const f of freqs) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = f
    osc.type = 'triangle'
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + duration)
    t += duration * 0.8
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // ignore — vibration isn't available on every device/browser
  }
}

export function celebrateFour() {
  confetti({ particleCount: 55, spread: 55, startVelocity: 35, origin: { y: 0.7 }, colors: ['#3987e5', '#f0efec', '#9085e9'] })
  beep([523.25, 659.25])
  vibrate(40)
}

export function celebrateSix() {
  confetti({ particleCount: 140, spread: 100, startVelocity: 48, origin: { y: 0.6 }, colors: ['#fab219', '#d95926', '#3987e5', '#0ca30c'] })
  confetti({ particleCount: 60, spread: 130, startVelocity: 55, origin: { y: 0.5 }, angle: 60, colors: ['#fab219', '#e66767'] })
  beep([523.25, 659.25, 783.99, 1046.5])
  vibrate([40, 30, 60])
}

export function celebrateWicket() {
  confetti({ particleCount: 36, spread: 50, startVelocity: 28, origin: { y: 0.7 }, colors: ['#e66767', '#898781'], scalar: 0.85, gravity: 1.3, ticks: 150 })
  beep([392, 329.63, 261.63])
  vibrate([80, 40, 80])
}
