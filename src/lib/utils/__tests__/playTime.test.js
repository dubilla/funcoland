import {
  getEffectiveMainTime,
  getEffectiveCompletionTime,
  formatHours,
  formatTime,
} from '../playTime';

describe('playTime utilities', () => {
  describe('getEffectiveMainTime', () => {
    it('returns null for null userGame', () => {
      expect(getEffectiveMainTime(null)).toBeNull();
    });

    it('returns null for undefined userGame', () => {
      expect(getEffectiveMainTime(undefined)).toBeNull();
    });

    it('returns customMainTime when set', () => {
      const userGame = {
        customMainTime: 120,
        game: { hltbMainTime: 180 },
      };
      expect(getEffectiveMainTime(userGame)).toBe(120);
    });

    it('falls back to hltbMainTime when customMainTime is null', () => {
      const userGame = {
        customMainTime: null,
        game: { hltbMainTime: 180 },
      };
      expect(getEffectiveMainTime(userGame)).toBe(180);
    });

    it('falls back to hltbMainTime when customMainTime is undefined', () => {
      const userGame = {
        game: { hltbMainTime: 180 },
      };
      expect(getEffectiveMainTime(userGame)).toBe(180);
    });

    it('returns null when both custom and hltb times are null', () => {
      const userGame = {
        customMainTime: null,
        game: { hltbMainTime: null },
      };
      expect(getEffectiveMainTime(userGame)).toBeNull();
    });

    it('returns null when game object is missing', () => {
      const userGame = {
        customMainTime: null,
      };
      expect(getEffectiveMainTime(userGame)).toBeNull();
    });

    it('prefers customMainTime of 0 over hltbMainTime', () => {
      // 0 is falsy, so it should fall back to hltb
      const userGame = {
        customMainTime: 0,
        game: { hltbMainTime: 180 },
      };
      expect(getEffectiveMainTime(userGame)).toBe(180);
    });
  });

  describe('getEffectiveCompletionTime', () => {
    it('returns null for null userGame', () => {
      expect(getEffectiveCompletionTime(null)).toBeNull();
    });

    it('returns customCompletionTime when set', () => {
      const userGame = {
        customCompletionTime: 300,
        game: { hltbCompletionTime: 400 },
      };
      expect(getEffectiveCompletionTime(userGame)).toBe(300);
    });

    it('falls back to hltbCompletionTime when customCompletionTime is null', () => {
      const userGame = {
        customCompletionTime: null,
        game: { hltbCompletionTime: 400 },
      };
      expect(getEffectiveCompletionTime(userGame)).toBe(400);
    });

    it('returns null when both times are unavailable', () => {
      const userGame = {
        game: {},
      };
      expect(getEffectiveCompletionTime(userGame)).toBeNull();
    });
  });

  describe('formatHours', () => {
    it('returns "0h" for null', () => {
      expect(formatHours(null)).toBe('0h');
    });

    it('returns "0h" for 0', () => {
      expect(formatHours(0)).toBe('0h');
    });

    it('returns "0h" for undefined', () => {
      expect(formatHours(undefined)).toBe('0h');
    });

    it('formats 60 minutes as 1h', () => {
      expect(formatHours(60)).toBe('1h');
    });

    it('formats 120 minutes as 2h', () => {
      expect(formatHours(120)).toBe('2h');
    });

    it('rounds to nearest hour', () => {
      expect(formatHours(90)).toBe('2h'); // 1.5 hours rounds to 2
      expect(formatHours(75)).toBe('1h'); // 1.25 hours rounds to 1
    });
  });

  describe('formatTime', () => {
    it('returns "Unknown" for null', () => {
      expect(formatTime(null)).toBe('Unknown');
    });

    it('returns "Unknown" for 0', () => {
      expect(formatTime(0)).toBe('Unknown');
    });

    it('returns "Unknown" for undefined', () => {
      expect(formatTime(undefined)).toBe('Unknown');
    });

    it('formats minutes only when less than an hour', () => {
      expect(formatTime(30)).toBe('30 minutes');
      expect(formatTime(45)).toBe('45 minutes');
    });

    it('formats hours only when no remaining minutes', () => {
      expect(formatTime(60)).toBe('1 hours');
      expect(formatTime(120)).toBe('2 hours');
    });

    it('formats hours and minutes', () => {
      expect(formatTime(90)).toBe('1 hours, 30 minutes');
      expect(formatTime(150)).toBe('2 hours, 30 minutes');
    });
  });
});
