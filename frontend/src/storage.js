import { normalizeYarnWithHistory } from './priceHistory';

const STORAGE_KEY = 'yarnList';

const normalizeYarn = (item) => normalizeYarnWithHistory(item);

export const saveYarnList = (yarnList) => {
  // Ensure each item has the required fields
  const validatedList = yarnList.map(normalizeYarn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedList));
};

export const loadYarnList = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    // Validate and ensure structure
    return parsed.map(normalizeYarn);
  } catch (error) {
    console.error('Error parsing yarn list from localStorage:', error);
    return [];
  }
};
