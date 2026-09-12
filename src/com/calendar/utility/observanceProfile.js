export const TRADITIONS = [
  { id: 'general', labelKey: 'traditionGeneral' },
  { id: 'shwetambar', labelKey: 'traditionShwetambar' },
  { id: 'digambar', labelKey: 'traditionDigambar' },
  { id: 'sthanakvasi', labelKey: 'traditionSthanakvasi' },
];

export const CALENDAR_REGIONS = [
  { id: 'location', labelKey: 'regionLocation' },
  { id: 'western-india', labelKey: 'regionWesternIndia' },
  { id: 'northern-india', labelKey: 'regionNorthernIndia' },
  { id: 'local-sangh', labelKey: 'regionLocalSangh' },
];

export const DEFAULT_OBSERVANCE_PROFILE = {
  tradition: 'general',
  calendarRegion: 'location',
};

export const normalizeObservanceProfile = profile => ({
  ...DEFAULT_OBSERVANCE_PROFILE,
  ...(profile || {}),
});
