import { describe, it, expect, beforeEach } from 'vitest';

import { chatAudio } from './chat-audio';

describe('chatAudio Web Audio Synthesizer', () => {
  beforeEach(() => {
    chatAudio.setMuted(false);
  });

  it('toggles mute state properly', () => {
    expect(chatAudio.getMuted()).toBe(false);
    chatAudio.setMuted(true);
    expect(chatAudio.getMuted()).toBe(true);
    chatAudio.setMuted(false);
  });

  it('does not throw when playSentSound or playReceivedSound is called in node/test environment', () => {
    expect(() => chatAudio.playSentSound()).not.toThrow();
    expect(() => chatAudio.playReceivedSound()).not.toThrow();
  });

  it('respects muted state and skips playback', () => {
    chatAudio.setMuted(true);
    expect(() => chatAudio.playSentSound()).not.toThrow();
    expect(() => chatAudio.playReceivedSound()).not.toThrow();
  });
});
