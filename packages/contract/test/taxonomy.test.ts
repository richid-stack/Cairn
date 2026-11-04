import { describe, expect, it } from 'vitest';
import { analyticsEvents, isValidEventName } from '../src/taxonomy.js';

describe('analytics taxonomy', () => {
  it('names every event surface.object.verb with known parts', () => {
    for (const name of analyticsEvents) {
      expect(isValidEventName(name), name).toBe(true);
    }
  });

  it('has no duplicate names', () => {
    expect(new Set(analyticsEvents).size).toBe(analyticsEvents.length);
  });

  it('rejects bad names', () => {
    expect(isValidEventName('chat.send')).toBe(false);
    expect(isValidEventName('Chat.composer.send')).toBe(false);
    expect(isValidEventName('chat.composer.explode')).toBe(false);
    expect(isValidEventName('unknown.composer.send')).toBe(false);
  });
});
