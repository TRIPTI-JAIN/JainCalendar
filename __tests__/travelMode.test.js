import {
  detectTravelChange,
  distanceBetweenKm,
  getTravelSignature,
} from '../src/com/calendar/utility/travelMode';

describe('travel mode detection', () => {
  const ahmedabad = {
    lat: 23.0225,
    lon: 72.5714,
    timezone: 'Asia/Kolkata',
  };

  test('ignores normal movement near the selected city', () => {
    const result = detectTravelChange({
      savedCity: ahmedabad,
      currentCoords: { lat: 23.05, lon: 72.6 },
      deviceTimezone: 'Asia/Kolkata',
    });
    expect(result.changed).toBe(false);
    expect(result.distanceKm).toBeLessThan(75);
  });

  test('detects a meaningful city change', () => {
    const mumbai = { lat: 19.076, lon: 72.8777 };
    expect(distanceBetweenKm(ahmedabad, mumbai)).toBeGreaterThan(400);
    expect(
      detectTravelChange({
        savedCity: ahmedabad,
        currentCoords: mumbai,
        deviceTimezone: 'Asia/Kolkata',
      }).changed,
    ).toBe(true);
  });

  test('detects timezone changes and creates stable dismissal signatures', () => {
    expect(
      detectTravelChange({
        savedCity: ahmedabad,
        currentCoords: ahmedabad,
        deviceTimezone: 'Europe/London',
      }).timezoneChanged,
    ).toBe(true);
    expect(getTravelSignature(ahmedabad, 'Asia/Kolkata')).toBe(
      '23.0:72.6:Asia/Kolkata',
    );
  });
});
