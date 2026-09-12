import { getSunriseSunset } from '../src/com/calendar/utility/constant';

describe('sunrise and sunset loading', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('returns live values when the service responds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: {
          sunrise: '2026-09-12T00:45:00+00:00',
          sunset: '2026-09-12T13:10:00+00:00',
        },
      }),
    });

    await expect(getSunriseSunset(23.02, 72.57)).resolves.toEqual(
      expect.objectContaining({
        sunrise: expect.any(String),
        sunset: expect.any(String),
      }),
    );
  });

  test('stops waiting after the configured timeout', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );

    const result = getSunriseSunset(23.02, 72.57, 25);
    jest.advanceTimersByTime(25);
    await expect(result).resolves.toBeNull();
  });
});
