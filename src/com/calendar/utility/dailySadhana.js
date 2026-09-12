import moment from 'moment';

export const SADHANA_PRACTICES = [
  'samayik',
  'pratikraman',
  'svadhyay',
  'seva',
];

export const getCompletedPracticeCount = dailyEntry =>
  SADHANA_PRACTICES.filter(key => Boolean(dailyEntry?.[key])).length;

export const isSadhanaDayComplete = dailyEntry =>
  getCompletedPracticeCount(dailyEntry) === SADHANA_PRACTICES.length;

export const calculateSadhanaStreak = (dailySadhana = {}, today = moment()) => {
  const cursor = moment(today).startOf('day');

  // An unfinished today should not erase a streak completed through yesterday.
  if (!isSadhanaDayComplete(dailySadhana[cursor.format('YYYY-MM-DD')])) {
    cursor.subtract(1, 'day');
  }

  let streak = 0;
  while (isSadhanaDayComplete(dailySadhana[cursor.format('YYYY-MM-DD')])) {
    streak += 1;
    cursor.subtract(1, 'day');
  }

  return streak;
};
