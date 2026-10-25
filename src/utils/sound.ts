// Web Audio API Synthesis - Universal High-Volume UI Audio Feedback
// Generates loud, crisp, tactile click/pop sounds without any external audio file dependency

let audioCtx: AudioContext | null = null;
let lastPlayTime = 0;
const AUDIO_COOLDOWN_MS = 100; // Minimum threshold to prevent rapid duplicate/echo triggers

const shouldThrottleSound = (): boolean => {
  const now = Date.now();
  if (now - lastPlayTime < AUDIO_COOLDOWN_MS) {
    return true;
  }
  lastPlayTime = now;
  return false;
};

export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('fx_sound_pref') !== 'false';
};

export const setSoundEnabled = (enabled: boolean) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fx_sound_pref', enabled ? 'true' : 'false');
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
};

/**
 * Punchy, high-volume modern UI mechanical click sound (~35ms)
 * Audible & tactile on phone and laptop speakers
 */
export const playClickSound = (volume: number = 0.35) => {
  if (!isSoundEnabled() || shouldThrottleSound()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Apply master amplification so even legacy 0.04-0.06 calls are punchy and loud
    const effectiveVolume = Math.max(volume >= 0.2 ? volume : volume * 7, 0.35);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.035);

    gain.gain.setValueAtTime(effectiveVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (e) {
    // Silent fail
  }
};

/**
 * Rich, high-volume modern bubble pop sound (~45ms)
 * Perfect for modal opens, favorite toggles, and tab switches
 */
export const playPopSound = (volume: number = 0.38) => {
  if (!isSoundEnabled() || shouldThrottleSound()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const effectiveVolume = Math.max(volume >= 0.2 ? volume : volume * 7, 0.38);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(1050, now + 0.042);

    gain.gain.setValueAtTime(effectiveVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    // Silent fail
  }
};

/**
 * Vibrant high-tech chime sound for success actions (like prompt copy)
 */
export const playSuccessChime = (volume: number = 0.32) => {
  if (!isSoundEnabled() || shouldThrottleSound()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const effectiveVolume = Math.max(volume >= 0.2 ? volume : volume * 6, 0.32);
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc2.frequency.setValueAtTime(1479.98, now + 0.04); // F#6

    gain.gain.setValueAtTime(effectiveVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.06);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.14);
  } catch (e) {
    // Silent fail
  }
};
