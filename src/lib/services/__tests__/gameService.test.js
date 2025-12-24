/* eslint-env jest */
import {
  STATE_TRANSITIONS,
  isValidTransition,
  getValidTransitions,
} from '../gameService';

describe('State Machine', () => {
  describe('STATE_TRANSITIONS', () => {
    it('defines valid transitions for all states', () => {
      expect(STATE_TRANSITIONS.WISHLIST).toEqual(['BACKLOG', 'CURRENTLY_PLAYING']);
      expect(STATE_TRANSITIONS.BACKLOG).toEqual(['WISHLIST', 'CURRENTLY_PLAYING']);
      expect(STATE_TRANSITIONS.CURRENTLY_PLAYING).toEqual(['BACKLOG', 'COMPLETED', 'ABANDONED']);
      expect(STATE_TRANSITIONS.COMPLETED).toEqual(['CURRENTLY_PLAYING']);
      expect(STATE_TRANSITIONS.ABANDONED).toEqual(['BACKLOG', 'CURRENTLY_PLAYING']);
    });
  });

  describe('isValidTransition', () => {
    describe('from WISHLIST', () => {
      it('allows transition to BACKLOG', () => {
        expect(isValidTransition('WISHLIST', 'BACKLOG')).toBe(true);
      });

      it('allows transition to CURRENTLY_PLAYING', () => {
        expect(isValidTransition('WISHLIST', 'CURRENTLY_PLAYING')).toBe(true);
      });

      it('rejects transition to COMPLETED', () => {
        expect(isValidTransition('WISHLIST', 'COMPLETED')).toBe(false);
      });

      it('rejects transition to ABANDONED', () => {
        expect(isValidTransition('WISHLIST', 'ABANDONED')).toBe(false);
      });

      it('rejects transition to same state', () => {
        expect(isValidTransition('WISHLIST', 'WISHLIST')).toBe(false);
      });
    });

    describe('from BACKLOG', () => {
      it('allows transition to WISHLIST', () => {
        expect(isValidTransition('BACKLOG', 'WISHLIST')).toBe(true);
      });

      it('allows transition to CURRENTLY_PLAYING', () => {
        expect(isValidTransition('BACKLOG', 'CURRENTLY_PLAYING')).toBe(true);
      });

      it('rejects transition to COMPLETED', () => {
        expect(isValidTransition('BACKLOG', 'COMPLETED')).toBe(false);
      });

      it('rejects transition to ABANDONED', () => {
        expect(isValidTransition('BACKLOG', 'ABANDONED')).toBe(false);
      });

      it('rejects transition to same state', () => {
        expect(isValidTransition('BACKLOG', 'BACKLOG')).toBe(false);
      });
    });

    describe('from CURRENTLY_PLAYING', () => {
      it('allows transition to BACKLOG', () => {
        expect(isValidTransition('CURRENTLY_PLAYING', 'BACKLOG')).toBe(true);
      });

      it('allows transition to COMPLETED', () => {
        expect(isValidTransition('CURRENTLY_PLAYING', 'COMPLETED')).toBe(true);
      });

      it('allows transition to ABANDONED', () => {
        expect(isValidTransition('CURRENTLY_PLAYING', 'ABANDONED')).toBe(true);
      });

      it('rejects transition to WISHLIST', () => {
        expect(isValidTransition('CURRENTLY_PLAYING', 'WISHLIST')).toBe(false);
      });

      it('rejects transition to same state', () => {
        expect(isValidTransition('CURRENTLY_PLAYING', 'CURRENTLY_PLAYING')).toBe(false);
      });
    });

    describe('from COMPLETED', () => {
      it('allows transition to CURRENTLY_PLAYING (replay)', () => {
        expect(isValidTransition('COMPLETED', 'CURRENTLY_PLAYING')).toBe(true);
      });

      it('rejects transition to BACKLOG', () => {
        expect(isValidTransition('COMPLETED', 'BACKLOG')).toBe(false);
      });

      it('rejects transition to WISHLIST', () => {
        expect(isValidTransition('COMPLETED', 'WISHLIST')).toBe(false);
      });

      it('rejects transition to ABANDONED', () => {
        expect(isValidTransition('COMPLETED', 'ABANDONED')).toBe(false);
      });

      it('rejects transition to same state', () => {
        expect(isValidTransition('COMPLETED', 'COMPLETED')).toBe(false);
      });
    });

    describe('from ABANDONED', () => {
      it('allows transition to BACKLOG', () => {
        expect(isValidTransition('ABANDONED', 'BACKLOG')).toBe(true);
      });

      it('allows transition to CURRENTLY_PLAYING', () => {
        expect(isValidTransition('ABANDONED', 'CURRENTLY_PLAYING')).toBe(true);
      });

      it('rejects transition to WISHLIST', () => {
        expect(isValidTransition('ABANDONED', 'WISHLIST')).toBe(false);
      });

      it('rejects transition to COMPLETED', () => {
        expect(isValidTransition('ABANDONED', 'COMPLETED')).toBe(false);
      });

      it('rejects transition to same state', () => {
        expect(isValidTransition('ABANDONED', 'ABANDONED')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns false for unknown source state', () => {
        expect(isValidTransition('UNKNOWN', 'BACKLOG')).toBe(false);
      });

      it('returns false for unknown target state', () => {
        expect(isValidTransition('BACKLOG', 'UNKNOWN')).toBe(false);
      });
    });
  });

  describe('getValidTransitions', () => {
    it('returns valid transitions for WISHLIST', () => {
      expect(getValidTransitions('WISHLIST')).toEqual(['BACKLOG', 'CURRENTLY_PLAYING']);
    });

    it('returns valid transitions for BACKLOG', () => {
      expect(getValidTransitions('BACKLOG')).toEqual(['WISHLIST', 'CURRENTLY_PLAYING']);
    });

    it('returns valid transitions for CURRENTLY_PLAYING', () => {
      expect(getValidTransitions('CURRENTLY_PLAYING')).toEqual(['BACKLOG', 'COMPLETED', 'ABANDONED']);
    });

    it('returns valid transitions for COMPLETED', () => {
      expect(getValidTransitions('COMPLETED')).toEqual(['CURRENTLY_PLAYING']);
    });

    it('returns valid transitions for ABANDONED', () => {
      expect(getValidTransitions('ABANDONED')).toEqual(['BACKLOG', 'CURRENTLY_PLAYING']);
    });

    it('returns empty array for unknown state', () => {
      expect(getValidTransitions('UNKNOWN')).toEqual([]);
    });
  });
});
