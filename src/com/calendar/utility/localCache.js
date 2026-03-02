import RNFS from 'react-native-fs';

const CACHE_FILE = `${RNFS.DocumentDirectoryPath}/sunrise_sunset_cache.json`;

export const getCachedSunData = async () => {
  try {
    const exists = await RNFS.exists(CACHE_FILE);
    if (!exists) return null;
    const content = await RNFS.readFile(CACHE_FILE, 'utf8');
    if (!content) return null;
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read cache:', error);
    return null;
  }
};

export const setCachedSunData = async payload => {
  try {
    await RNFS.writeFile(CACHE_FILE, JSON.stringify(payload), 'utf8');
  } catch (error) {
    console.error('Failed to write cache:', error);
  }
};

export const formatUpdatedAt = isoString => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString();
};
