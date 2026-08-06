/**
 * Web Audio API synthesized audio effects for DeskOS
 * Zero external audio assets required - 100% instant, reliable sound effects
 */

let audioCtx: AudioContext | null = null;
let isMutedState = false;

// Initialize mute state from localStorage
try {
  const storedMute = localStorage.getItem('deskos_sound_muted');
  if (storedMute !== null) {
    isMutedState = storedMute === 'true';
  }
} catch (e) {
  // Ignore localStorage errors
}

export function isAudioMuted(): boolean {
  return isMutedState;
}

export function setAudioMuted(muted: boolean): boolean {
  isMutedState = muted;
  try {
    localStorage.setItem('deskos_sound_muted', String(muted));
  } catch (e) {
    // Ignore localStorage errors
  }
  return isMutedState;
}

export function toggleAudioMute(): boolean {
  return setAudioMuted(!isMutedState);
}

function getAudioContext(): AudioContext | null {
  if (isMutedState) return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a crisp, subtle pop/click sound when launching a DeskOS app icon
 */
export function playAppLaunchSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}

/**
 * Plays a soft click sound for button interactions
 */
export function playButtonClickSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
}

/**
 * Plays a magical ascending star reward fanfare chime (C5 - E5 - G5 - C6 chime)
 */
export function playStarRewardSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Ascending arpeggio frequencies (C5: 523.25Hz, E5: 659.25Hz, G5: 783.99Hz, C6: 1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.35);
    });
  } catch (err) {
    console.warn('Star reward sound playback failed:', err);
  }
}

/**
 * Plays a soft dual-tone chime when deducting stars / reminder
 */
export function playWarningDeductSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [400, 320];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.12, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  } catch (err) {
    console.warn('Deduct sound playback failed:', err);
  }
}

/**
 * Plays a grand victory fanfare audio sequence for Monthly Top 3 Student Celebration!
 */
export function playVictoryFanfareSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Victory fanfare melody (C5, G5, C6, E6, G6)
    const notes = [
      { freq: 523.25, duration: 0.15, delay: 0 },
      { freq: 783.99, duration: 0.15, delay: 0.15 },
      { freq: 1046.50, duration: 0.2, delay: 0.3 },
      { freq: 1318.51, duration: 0.25, delay: 0.5 },
      { freq: 1567.98, duration: 0.6, delay: 0.75 },
    ];

    notes.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.freq, now + item.delay);

      gain.gain.setValueAtTime(0, now + item.delay);
      gain.gain.linearRampToValueAtTime(0.25, now + item.delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.delay + item.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + item.delay);
      osc.stop(now + item.delay + item.duration);
    });
  } catch (err) {
    console.warn('Victory fanfare playback failed:', err);
  }
}

/**
 * Plays a cheerful, bubbly sprout pop sound when plant grows to Level 2 (Nảy mầm)
 */
export function playSproutPopSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.2);
    });
  } catch (err) {
    console.warn('Sprout pop sound playback failed:', err);
  }
}

/**
 * Plays a shimmering harp/chime fanfare sound when plant blooms into Level 6 (Ra hoa) or Level 7 (Kết trái)
 */
export function playBloomFanfareSound(): void {
  if (isMutedState) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Shimmering harp scale (E5, G#5, B5, E6, G#6, B6)
    const harpNotes = [659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53];
    harpNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.5);
    });
  } catch (err) {
    console.warn('Bloom fanfare sound playback failed:', err);
  }
}
