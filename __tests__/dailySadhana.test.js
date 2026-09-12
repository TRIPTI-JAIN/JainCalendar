import moment from 'moment';
import {
  calculateSadhanaStreak,
  getCompletedPracticeCount,
  isSadhanaDayComplete,
} from '../src/com/calendar/utility/dailySadhana';

const complete = {
  samayik: true,
  pratikraman: true,
  svadhyay: true,
  seva: true,
};

describe('daily sadhana', () => {
  test('counts completed practices', () => {
    expect(getCompletedPracticeCount({ samayik: true, seva: true })).toBe(2);
    expect(isSadhanaDayComplete(complete)).toBe(true);
  });

  test('counts consecutive complete days including today', () => {
    expect(
      calculateSadhanaStreak(
        {
          '2026-09-10': complete,
          '2026-09-11': complete,
          '2026-09-12': complete,
        },
        moment('2026-09-12'),
      ),
    ).toBe(3);
  });

  test('keeps the streak through yesterday while today is unfinished', () => {
    expect(
      calculateSadhanaStreak(
        {
          '2026-09-10': complete,
          '2026-09-11': complete,
          '2026-09-12': { samayik: true },
        },
        moment('2026-09-12'),
      ),
    ).toBe(2);
  });
});
