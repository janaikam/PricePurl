import { normalizeYarnWithHistory } from './priceHistory';

const STORAGE_KEY = 'yarnList';

const normalizeYarn = (item) => normalizeYarnWithHistory(item);
const normalizeName = (name = '') => name.trim().toLowerCase();

const loadStoredYarnList = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return parsed.map(normalizeYarn);
  } catch (error) {
    console.error('Error parsing yarn list from localStorage:', error);
    return [];
  }
};

export const saveYarnList = (yarnList) => {
  const validatedList = yarnList.map(normalizeYarn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedList));
};

export const loadYarnList = () => loadStoredYarnList();

const findGuestMatches = (yarnList, name) => {
  const normalizedName = normalizeName(name);

  return yarnList.filter((item) => normalizeName(item.name) === normalizedName);
};

const requireGuestYarn = (yarnList, id) => {
  const existingYarn = yarnList.find((item) => item.id === id);

  if (!existingYarn) {
    const error = new Error('Yarn entry not found');
    error.status = 404;
    throw error;
  }

  return existingYarn;
};

export const guestStorageRepository = {
  fetchYarnList: async () => loadStoredYarnList(),
  checkYarnDuplicate: async (name) => {
    const matches = findGuestMatches(loadStoredYarnList(), name);

    return {
      existsInDatabase: matches.length > 0,
      alreadyOnUserList: matches.length > 0,
      yarnId: matches[0]?.id || null,
      matchedName: matches[0]?.name || null,
      matchingEntryIds: matches.map((item) => item.id),
    };
  },
  createYarnEntry: async (yarn, { allowDuplicate = false } = {}) => {
    const yarnList = loadStoredYarnList();
    const matches = findGuestMatches(yarnList, yarn.name || '');

    if (matches.length > 0 && !allowDuplicate) {
      const error = new Error('Yarn already exists on your guest list');
      error.status = 409;
      throw error;
    }

    const createdYarn = normalizeYarn({
      ...yarn,
      id: yarn.id || crypto.randomUUID(),
      status: yarn.status || 'active',
    });
    saveYarnList([...yarnList, createdYarn]);
    return createdYarn;
  },
  updateYarnEntry: async (id, yarn) => {
    const yarnList = loadStoredYarnList();
    requireGuestYarn(yarnList, id);
    const updatedYarn = normalizeYarn({
      ...yarn,
      id,
    });

    saveYarnList(yarnList.map((item) => (item.id === id ? updatedYarn : item)));
    return updatedYarn;
  },
  updateYarnEntryStatus: async (id, status) => {
    const yarnList = loadStoredYarnList();
    const existingYarn = requireGuestYarn(yarnList, id);
    const updatedYarn = normalizeYarn({
      ...existingYarn,
      status,
    });

    saveYarnList(yarnList.map((item) => (item.id === id ? updatedYarn : item)));
    return updatedYarn;
  },
  deleteYarnEntry: async (id) => {
    const yarnList = loadStoredYarnList();
    requireGuestYarn(yarnList, id);
    saveYarnList(yarnList.filter((item) => item.id !== id));
    return { id };
  },
};
