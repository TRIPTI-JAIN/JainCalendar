import moment from 'moment';
import { MhahPanchang } from 'mhah-panchang';

const panchangEngine = new MhahPanchang();

export const DEFAULT_COORDS = { lat: 23.0225, lon: 72.5714 };

export const DEFAULT_CITIES = [
  {
    id: 'ahmedabad-default',
    name: 'Ahmedabad',
    lat: DEFAULT_COORDS.lat,
    lon: DEFAULT_COORDS.lon,
    source: 'default',
  },
];

const FESTIVAL_RULES = [
  {
    id: 'mahavir-jayanti',
    title: 'Mahavir Jayanti',
    significance:
      'Birth celebration of Bhagwan Mahavir observed with prayer and seva.',
    observance:
      'Devotees often visit derasar, listen to discourses, join processions, and offer seva in remembrance of Mahavir Swami.',
    reflection:
      'Focus on ahimsa, aparigraha, self-restraint, and compassion in daily conduct.',
    highlights: [
      'Temple visit and peaceful prayer',
      'Bhagwan Mahavir life reading',
      'Acts of compassion and seva',
    ],
    match: ({ moonMasa, paksha, lunarDayNo }) =>
      moonMasa.includes('chaitra') &&
      paksha.includes('shukla') &&
      lunarDayNo === 13,
  },
  {
    id: 'paryushan-start',
    title: 'Paryushan Aarambh',
    significance:
      'Beginning of Paryushan, dedicated to introspection, prayer, and tapas.',
    observance:
      'This period is usually marked by pratikraman, scripture study, restraint, and a simplified daily routine.',
    reflection:
      'Use the opening day to set a sankalp for forgiveness, discipline, and mindful speech.',
    highlights: [
      'Begin a pratikraman routine',
      'Choose a tapas or restraint goal',
      'Reduce distractions and focus inward',
    ],
    match: ({ moonMasa, paksha, lunarDayNo }) =>
      moonMasa.includes('bhadra') &&
      paksha.includes('shukla') &&
      lunarDayNo === 12,
  },
  {
    id: 'samvatsari',
    title: 'Samvatsari',
    significance:
      'Day of universal forgiveness and pratikraman with Michhami Dukkadam.',
    observance:
      'Many Jains observe an extended pratikraman and seek forgiveness from family, friends, and the wider community.',
    reflection:
      'The core spirit is humility, release of ego, and sincere repentance for harm done knowingly or unknowingly.',
    highlights: [
      'Samvatsari pratikraman',
      'Michhami Dukkadam messages',
      'Deep forgiveness practice',
    ],
    match: ({ moonMasa, paksha, lunarDayNo }) =>
      moonMasa.includes('bhadra') &&
      paksha.includes('shukla') &&
      lunarDayNo === 4,
  },
  {
    id: 'mahaveer-nirvan',
    title: 'Diwali (Nirvana Divas)',
    significance:
      'Commemorates Bhagwan Mahavir nirvana and the Jain new year transition.',
    observance:
      'Observed with devotion, lamp lighting, scripture reading, and remembrance of Bhagwan Mahavir nirvana.',
    reflection:
      'Contemplate liberation, right knowledge, and the light of inner awareness over external celebration.',
    highlights: [
      'Mahavir nirvana remembrance',
      'Deep spiritual reflection',
      'Scripture reading and lamp lighting',
    ],
    match: ({ moonMasa, paksha, lunarDayNo }) =>
      (moonMasa.includes('kartika') || moonMasa.includes('kartik')) &&
      paksha.includes('krishna') &&
      lunarDayNo === 15,
  },
  {
    id: 'gyan-panchami',
    title: 'Gyan Panchami',
    significance:
      'Auspicious day for scriptural reverence, study, and knowledge worship.',
    observance:
      'Common observances include cleaning scriptures, recitation, and dedicating time to svadhyaya.',
    reflection:
      'Give attention to right knowledge and disciplined learning rather than information without transformation.',
    highlights: [
      'Scripture reverence',
      'Focused svadhyaya',
      'Study and recitation discipline',
    ],
    match: ({ moonMasa, paksha, lunarDayNo }) =>
      (moonMasa.includes('kartika') || moonMasa.includes('kartik')) &&
      paksha.includes('shukla') &&
      lunarDayNo === 5,
  },
];

const FASTING_MAP = {
  8: {
    id: 'ashtami-upvas',
    title: 'Ashtami Upvas',
    significance: 'Traditional fasting marker for Ashtami.',
  },
  11: {
    id: 'ekadashi-tap',
    title: 'Ekadashi Tap',
    significance: 'Tap and discipline observance on Ekadashi.',
  },
  14: {
    id: 'chaudas-upvas',
    title: 'Chaudas Upvas',
    significance: 'Chaudas fasting observance.',
  },
  15: {
    id: 'purnima-amavasya-tap',
    title: 'Purnima / Amavasya Tap',
    significance: 'A stronger tap marker for full and no moon observances.',
  },
};

const normalize = value => String(value || '').toLowerCase();

const formatSunTimerValue = date =>
  date && !isNaN(new Date(date).getTime())
    ? moment(date).local().format('hh:mm A')
    : '—';

const getLunarDayNo = tithiNo => {
  if (!Number.isFinite(tithiNo) || tithiNo <= 0) return null;
  return ((tithiNo - 1) % 15) + 1;
};

export const getFestivalMeta = context => {
  const normalized = {
    moonMasa: normalize(context.moonMasa),
    paksha: normalize(context.paksha),
    lunarDayNo: context.lunarDayNo,
  };
  const matchedRule = FESTIVAL_RULES.find(rule => rule.match(normalized));
  if (!matchedRule) return null;

  return {
    id: matchedRule.id,
    title: matchedRule.title,
    significance: matchedRule.significance,
    observance: matchedRule.observance,
    reflection: matchedRule.reflection,
    highlights: matchedRule.highlights || [],
  };
};

export const getFestivalById = festivalId => {
  const matchedRule = FESTIVAL_RULES.find(rule => rule.id === festivalId);
  if (!matchedRule) return null;

  return {
    id: matchedRule.id,
    title: matchedRule.title,
    significance: matchedRule.significance,
    observance: matchedRule.observance,
    reflection: matchedRule.reflection,
    highlights: matchedRule.highlights || [],
  };
};

export const getFastingMeta = ({ lunarDayNo }) => {
  if (!lunarDayNo) return null;
  return FASTING_MAP[lunarDayNo] || null;
};

export const buildDaySummary = (dateInput, lat, lon) => {
  const date = moment(dateInput).toDate();
  const calendar = panchangEngine.calendar(date, lat, lon);
  const sun = panchangEngine.sunTimer(date, lat, lon);
  const tithiNo = Number(calendar?.Tithi?.ino ?? 0);
  const lunarDayNo = getLunarDayNo(tithiNo);
  const paksha = calendar?.Paksha?.name_en_IN || 'Unknown';
  const moonMasa =
    calendar?.MoonMasa?.name_en_IN || calendar?.Masa?.name_en_IN || 'Unknown';
  const festival = getFestivalMeta({ moonMasa, paksha, lunarDayNo });
  const fasting = getFastingMeta({ lunarDayNo });

  return {
    date: moment(dateInput).format('YYYY-MM-DD'),
    displayDate: moment(dateInput).format('ddd, MMM D'),
    tithi: calendar?.Tithi?.name_en_IN || '—',
    paksha,
    moonMasa,
    sunrise: sun?.sunRise || null,
    sunset: sun?.sunSet || null,
    sunriseLabel: formatSunTimerValue(sun?.sunRise),
    sunsetLabel: formatSunTimerValue(sun?.sunSet),
    lunarDayNo,
    festival,
    fasting,
  };
};

export const buildMonthData = (current, lat, lon) => {
  const month = moment(current);
  const rows = [];

  for (let day = 1; day <= month.daysInMonth(); day += 1) {
    rows.push(buildDaySummary(moment(month).date(day), lat, lon));
  }

  return rows;
};

export const buildCalendarGrid = (current, monthData) => {
  const start = moment(current).startOf('month');
  const startWeekDay = start.day();
  const cells = [];

  for (let i = 0; i < startWeekDay; i += 1) {
    cells.push(null);
  }

  cells.push(...monthData);

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

export const buildUpcomingFestivals = (
  startDate,
  lat,
  lon,
  totalDays = 120,
) => {
  const festivals = [];
  const seen = new Set();

  for (let offset = 0; offset < totalDays; offset += 1) {
    const day = buildDaySummary(moment(startDate).add(offset, 'days'), lat, lon);
    if (!day.festival || seen.has(day.festival.id)) {
      continue;
    }
    seen.add(day.festival.id);
    festivals.push(day);
  }

  return festivals;
};

export const buildYearFestivals = (year, lat, lon) =>
  buildUpcomingFestivals(moment({ year, month: 0, day: 1 }), lat, lon, 366)
    .filter(item => moment(item.date).year() === year);

export const findDayByQuery = (query, rows) => {
  const cleaned = String(query || '').trim().toLowerCase();
  if (!cleaned) return null;

  return (
    rows.find(
      item =>
        item.date.toLowerCase() === cleaned ||
        item.displayDate.toLowerCase().includes(cleaned) ||
        item.tithi.toLowerCase().includes(cleaned) ||
        item.paksha.toLowerCase().includes(cleaned) ||
        item.moonMasa.toLowerCase().includes(cleaned) ||
        item.festival?.title.toLowerCase().includes(cleaned),
    ) || null
  );
};
