/**
 * Chat Sound Alert — Web Audio API notification tone.
 *
 * Generates a short "ding" sound programmatically.
 * No external audio file required.
 * Critical for Driver Portal — ensures drivers hear incoming dispatch messages.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Play a short notification "ding" tone.
 * Uses two oscillators for a pleasant two-tone chime.
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Gain envelope
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    // First tone — E5 (659 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659, now);
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone — A5 (880 Hz), slightly delayed
    const gain2 = ctx.createGain();
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.connect(gain2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.4);
  } catch {
    // Audio not supported or blocked — fail silently
  }
}
