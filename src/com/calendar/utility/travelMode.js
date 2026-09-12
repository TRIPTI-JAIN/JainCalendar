const EARTH_RADIUS_KM = 6371;

const toRadians = degrees => (degrees * Math.PI) / 180;

export const distanceBetweenKm = (first, second) => {
  if (
    !Number.isFinite(first?.lat) ||
    !Number.isFinite(first?.lon) ||
    !Number.isFinite(second?.lat) ||
    !Number.isFinite(second?.lon)
  ) {
    return 0;
  }

  const latDelta = toRadians(second.lat - first.lat);
  const lonDelta = toRadians(second.lon - first.lon);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(first.lat)) *
      Math.cos(toRadians(second.lat)) *
      Math.sin(lonDelta / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const detectTravelChange = ({
  savedCity,
  currentCoords,
  deviceTimezone,
  distanceThresholdKm = 75,
}) => {
  const distanceKm = distanceBetweenKm(savedCity, currentCoords);
  const timezoneChanged = Boolean(
    savedCity?.timezone &&
      deviceTimezone &&
      savedCity.timezone !== deviceTimezone,
  );

  return {
    changed: distanceKm >= distanceThresholdKm || timezoneChanged,
    distanceKm,
    timezoneChanged,
  };
};

export const getDeviceTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || null;

export const getTravelSignature = (coords, timezone) =>
  `${Number(coords?.lat || 0).toFixed(1)}:${Number(coords?.lon || 0).toFixed(
    1,
  )}:${timezone || ''}`;
