const STORAGE_KEY = 'yarnList';

export const saveYarnList = (yarnList) => {
  // Ensure each item has the required fields
  const validatedList = yarnList.map(item => ({
    id: item.id,
    name: item.name || '',
    url: item.url || '',
    currentPrice: item.currentPrice || '',
    lastChecked: item.lastChecked || new Date().toISOString(),
    priceSource: item.priceSource || 'manual'
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedList));
};

export const loadYarnList = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    // Validate and ensure structure
    return parsed.map(item => ({
      id: item.id,
      name: item.name || '',
      url: item.url || '',
      currentPrice: item.currentPrice || '',
      lastChecked: item.lastChecked || new Date().toISOString(),
      priceSource: item.priceSource || 'manual'
    }));
  } catch (error) {
    console.error('Error parsing yarn list from localStorage:', error);
    return [];
  }
};
