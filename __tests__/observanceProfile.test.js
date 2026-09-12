import { getFestivalMeta } from '../src/com/calendar/utility/jainData';
import { normalizeObservanceProfile } from '../src/com/calendar/utility/observanceProfile';

const context = lunarDayNo => ({
  moonMasa: 'Bhadrapada',
  paksha: 'Shukla',
  lunarDayNo,
});

describe('observance profiles', () => {
  test('keeps a general profile as the migration-safe default', () => {
    expect(normalizeObservanceProfile()).toEqual({
      tradition: 'general',
      calendarRegion: 'location',
    });
  });

  test('shows Samvatsari for Shwetambar but not Digambar', () => {
    expect(getFestivalMeta(context(4), { tradition: 'shwetambar' })?.id).toBe(
      'samvatsari',
    );
    expect(getFestivalMeta(context(4), { tradition: 'digambar' })).toBeNull();
  });

  test('shows the Das Lakshan cycle for Digambar but not Shwetambar', () => {
    expect(getFestivalMeta(context(5), { tradition: 'digambar' })?.id).toBe(
      'das-lakshan-start',
    );
    expect(getFestivalMeta(context(5), { tradition: 'shwetambar' })).toBeNull();
    expect(getFestivalMeta(context(14), { tradition: 'digambar' })?.id).toBe(
      'anant-chaturdashi',
    );
  });
});
