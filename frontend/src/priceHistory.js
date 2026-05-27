const DEFAULT_SOURCE = 'manual';

const normalizeDisplayPrice = (price) => {
  if (typeof price === 'number' && Number.isFinite(price)) {
    return `$${price.toFixed(2)}`;
  }

  if (typeof price !== 'string') {
    return '';
  }

  const numericPrice = parsePriceValue(price);
  if (numericPrice === null) {
    return price.trim();
  }

  return `$${numericPrice.toFixed(2)}`;
};

export const parsePriceValue = (price) => {
  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : null;
  }

  if (typeof price !== 'string') {
    return null;
  }

  const normalized = price.replace(/,/g, '').trim();
  const match = normalized.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
};

export const createPriceHistoryEntry = ({
  price,
  recordedAt = new Date().toISOString(),
  source = DEFAULT_SOURCE,
  id = crypto.randomUUID()
}) => {
  const numericPrice = parsePriceValue(price);

  if (numericPrice === null) {
    return null;
  }

  return {
    id,
    recordedAt,
    source,
    displayPrice: normalizeDisplayPrice(price),
    numericPrice
  };
};

export const normalizePriceHistory = (priceHistory = []) => (
  priceHistory
    .map((entry) => createPriceHistoryEntry({
      id: entry?.id,
      price: entry?.displayPrice ?? entry?.price ?? entry?.numericPrice,
      recordedAt: entry?.recordedAt,
      source: entry?.source
    }))
    .filter(Boolean)
    .sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime())
);

export const derivePriceMetadata = (priceHistory = []) => {
  if (priceHistory.length === 0) {
    return {
      currentPrice: '',
      currentPriceValue: null,
      lowestPrice: '',
      lowestPriceValue: null,
      lowestPriceAt: null
    };
  }

  const currentEntry = priceHistory[priceHistory.length - 1];
  const lowestPriceValue = Math.min(...priceHistory.map((entry) => entry.numericPrice));
  const lowestEntries = priceHistory.filter((entry) => entry.numericPrice === lowestPriceValue);
  const latestLowestEntry = lowestEntries[lowestEntries.length - 1];

  return {
    currentPrice: currentEntry.displayPrice,
    currentPriceValue: currentEntry.numericPrice,
    lowestPrice: latestLowestEntry.displayPrice,
    lowestPriceValue,
    lowestPriceAt: latestLowestEntry.recordedAt
  };
};

export const appendPriceHistory = (priceHistory = [], nextEntry) => {
  if (!nextEntry) {
    return normalizePriceHistory(priceHistory);
  }

  return normalizePriceHistory([...priceHistory, nextEntry]);
};

export const buildInitialPriceHistory = ({ currentPrice, lastChecked, priceSource }) => {
  const initialEntry = createPriceHistoryEntry({
    price: currentPrice,
    recordedAt: lastChecked,
    source: priceSource
  });

  return initialEntry ? [initialEntry] : [];
};

export const normalizeYarnWithHistory = (item = {}) => {
  const priceHistory = item.priceHistory?.length
    ? normalizePriceHistory(item.priceHistory)
    : buildInitialPriceHistory({
        currentPrice: item.currentPrice,
        lastChecked: item.lastChecked,
        priceSource: item.priceSource
      });

  const metadata = derivePriceMetadata(priceHistory);
  const lastHistoryEntry = priceHistory[priceHistory.length - 1];
  const regularPriceValue = parsePriceValue(item.regularPriceValue ?? item.regularPrice);
  const projectNote = typeof item.projectNote === 'string' ? item.projectNote.trim() : '';

  return {
    id: item.id,
    name: item.name || '',
    url: item.url || '',
    currentPrice: metadata.currentPrice,
    currentPriceValue: metadata.currentPriceValue,
    lastChecked: item.lastChecked || lastHistoryEntry?.recordedAt || new Date().toISOString(),
    lastAutoRefreshAt: item.lastAutoRefreshAt || null,
    lowestPrice: metadata.lowestPrice,
    lowestPriceValue: metadata.lowestPriceValue,
    lowestPriceAt: metadata.lowestPriceAt,
    priceHistory,
    priceSource: item.priceSource || DEFAULT_SOURCE,
    regularPrice: regularPriceValue === null ? '' : normalizeDisplayPrice(regularPriceValue),
    regularPriceValue,
    ...(projectNote ? { projectNote } : {}),
    siteName: item.siteName || '',
    status: item.status || 'active'
  };
};

export const derivePriceStatus = (yarn = {}) => {
  const currentPriceValue = yarn.currentPriceValue;
  const lowestPriceValue = yarn.lowestPriceValue;
  const regularPriceValue = yarn.regularPriceValue;

  const hasCurrentPrice = currentPriceValue !== null && currentPriceValue !== undefined;
  const hasLowestPrice = lowestPriceValue !== null && lowestPriceValue !== undefined;
  const hasRegularPrice = regularPriceValue !== null && regularPriceValue !== undefined;
  const isAtHistoricalLow = hasCurrentPrice
    && hasLowestPrice
    && currentPriceValue === lowestPriceValue
    && (!hasRegularPrice || currentPriceValue < regularPriceValue);
  const isOnSale = hasCurrentPrice
    && hasRegularPrice
    && currentPriceValue < regularPriceValue
    && !isAtHistoricalLow;

  return {
    isOnSale,
    isAtHistoricalLow
  };
};

export const updateYarnPrice = (yarn, {
  price,
  recordedAt = new Date().toISOString(),
  source = yarn?.priceSource || DEFAULT_SOURCE,
  name,
  siteName,
  lastAutoRefreshAt
}) => {
  const nextEntry = createPriceHistoryEntry({
    price,
    recordedAt,
    source
  });

  if (!nextEntry) {
    return normalizeYarnWithHistory({
      ...yarn,
      name: name ?? yarn.name,
      siteName: siteName ?? yarn.siteName,
      lastChecked: recordedAt,
      lastAutoRefreshAt: lastAutoRefreshAt ?? yarn.lastAutoRefreshAt
    });
  }

  return normalizeYarnWithHistory({
    ...yarn,
    name: name ?? yarn.name,
    siteName: siteName ?? yarn.siteName,
    currentPrice: nextEntry.displayPrice,
    lastChecked: recordedAt,
    lastAutoRefreshAt: lastAutoRefreshAt ?? yarn.lastAutoRefreshAt,
    priceHistory: appendPriceHistory(yarn.priceHistory, nextEntry)
  });
};