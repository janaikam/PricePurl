const { randomUUID } = require('node:crypto');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DEFAULT_STATUS = 'active';
const DEFAULT_SOURCE = 'manual';
const yarnCatalog = new Map();
const yarnEntries = new Map();

const normalizeName = (name = '') => name.trim().toLowerCase();

const parsePriceValue = (price) => {
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

const createPriceHistoryEntry = ({
  price,
  recordedAt = new Date().toISOString(),
  source = DEFAULT_SOURCE,
  id = randomUUID()
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

const buildInitialPriceHistory = ({ currentPrice, lastChecked, priceSource }) => {
  const initialEntry = createPriceHistoryEntry({
    price: currentPrice,
    recordedAt: lastChecked,
    source: priceSource
  });

  return initialEntry ? [initialEntry] : [];
};

const derivePriceMetadata = (priceHistory = []) => {
  if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
    return {
      currentPrice: '',
      currentPriceValue: null,
      lowestPrice: '',
      lowestPriceValue: null,
      lowestPriceAt: null,
      lastChecked: null
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
    lowestPriceAt: latestLowestEntry.recordedAt,
    lastChecked: currentEntry.recordedAt
  };
};

const getCatalogByNormalizedName = (normalizedName) => (
  [...yarnCatalog.values()].find((yarn) => yarn.normalizedName === normalizedName) || null
);

const getEntriesByYarnId = (yarnId) => (
  [...yarnEntries.values()].filter((entry) => entry.yarnId === yarnId)
);

const sanitizeCatalogYarn = (item = {}, existing = {}) => {
  const trimmedName = typeof item.name === 'string' ? item.name.trim() : '';
  const fallbackLastChecked = item.lastChecked ?? existing.lastChecked ?? new Date().toISOString();
  const fallbackPriceSource = item.priceSource || existing.priceSource || DEFAULT_SOURCE;
  const regularPriceValue = parsePriceValue(item.regularPriceValue ?? item.regularPrice ?? existing.regularPriceValue ?? existing.regularPrice);
  const priceHistory = Array.isArray(item.priceHistory)
    ? (item.priceHistory.length > 0
        ? item.priceHistory
        : buildInitialPriceHistory({
            currentPrice: item.currentPrice,
            lastChecked: fallbackLastChecked,
            priceSource: fallbackPriceSource
          }))
    : (existing.priceHistory?.length
        ? existing.priceHistory
        : buildInitialPriceHistory({
            currentPrice: item.currentPrice ?? existing.currentPrice,
            lastChecked: fallbackLastChecked,
            priceSource: fallbackPriceSource
          }));
  const derivedMetadata = derivePriceMetadata(priceHistory);

  return {
    id: existing.id || randomUUID(),
    normalizedName: normalizeName(trimmedName),
    name: trimmedName,
    url: typeof item.url === 'string' ? item.url : existing.url || '',
    currentPrice: derivedMetadata.currentPrice || (item.currentPrice ?? existing.currentPrice ?? ''),
    currentPriceValue: derivedMetadata.currentPriceValue ?? item.currentPriceValue ?? existing.currentPriceValue ?? null,
    lastChecked: derivedMetadata.lastChecked || fallbackLastChecked,
    lastAutoRefreshAt: item.lastAutoRefreshAt ?? existing.lastAutoRefreshAt ?? null,
    lowestPrice: derivedMetadata.lowestPrice || (item.lowestPrice ?? existing.lowestPrice ?? ''),
    lowestPriceValue: derivedMetadata.lowestPriceValue ?? item.lowestPriceValue ?? existing.lowestPriceValue ?? null,
    lowestPriceAt: derivedMetadata.lowestPriceAt || (item.lowestPriceAt ?? existing.lowestPriceAt ?? null),
    priceHistory,
    priceSource: fallbackPriceSource,
    regularPrice: regularPriceValue === null ? '' : normalizeDisplayPrice(regularPriceValue),
    regularPriceValue,
    siteName: typeof item.siteName === 'string' ? item.siteName : (existing.siteName || '')
  };
};

const buildJoinedYarn = (entry) => {
  const catalogYarn = yarnCatalog.get(entry.yarnId);

  if (!catalogYarn) {
    return null;
  }

  return {
    id: entry.id,
    yarnId: entry.yarnId,
    status: entry.status,
    name: catalogYarn.name,
    url: catalogYarn.url,
    currentPrice: catalogYarn.currentPrice,
    currentPriceValue: catalogYarn.currentPriceValue,
    lastChecked: catalogYarn.lastChecked,
    lastAutoRefreshAt: catalogYarn.lastAutoRefreshAt,
    lowestPrice: catalogYarn.lowestPrice,
    lowestPriceValue: catalogYarn.lowestPriceValue,
    lowestPriceAt: catalogYarn.lowestPriceAt,
    priceHistory: catalogYarn.priceHistory,
    priceSource: catalogYarn.priceSource,
    regularPrice: catalogYarn.regularPrice,
    regularPriceValue: catalogYarn.regularPriceValue,
    siteName: catalogYarn.siteName
  };
};

const removeCatalogIfUnreferenced = (yarnId) => {
  const remainingEntry = [...yarnEntries.values()].some((entry) => entry.yarnId === yarnId);

  if (!remainingEntry) {
    yarnCatalog.delete(yarnId);
  }
};

const createEntry = (yarnId, status = DEFAULT_STATUS) => {
  const entry = {
    id: randomUUID(),
    yarnId,
    status
  };

  yarnEntries.set(entry.id, entry);
  return entry;
};

// Scrape endpoint: calls Java scraper-service and returns product info
app.post('/scrape', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  // Call Java scraper-service via HTTP
  fetch('http://127.0.0.1:3002/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
    .then(r => r.json())
    .then(data => {
      if (data && data.name && data.price) {
        res.json({
          name: data.name,
          price: data.price,
          regularPrice: data.regularPrice,
          siteName: data.siteName,
          date: data.date
        });
      } else {
        res.status(500).json({ error: 'Failed to scrape product info' });
      }
    })
    .catch(e => {
      res.status(500).json({ error: 'Scraper service error', details: e.message });
    });
});

// Get all yarn items
app.get('/api/yarn', (req, res) => {
  res.json([...yarnEntries.values()].map(buildJoinedYarn).filter(Boolean));
});

app.get('/api/yarn/check', (req, res) => {
  const normalizedName = normalizeName(req.query.name || '');

  if (!normalizedName) {
    return res.status(400).json({ error: 'Yarn name is required' });
  }

  const catalogYarn = getCatalogByNormalizedName(normalizedName);
  const matchingEntries = catalogYarn ? getEntriesByYarnId(catalogYarn.id) : [];

  res.json({
    existsInDatabase: Boolean(catalogYarn),
    alreadyOnUserList: matchingEntries.length > 0,
    yarnId: catalogYarn?.id || null,
    matchedName: catalogYarn?.name || null,
    matchingEntryIds: matchingEntries.map((entry) => entry.id)
  });
});

// Add a new yarn item
app.post('/api/yarn', (req, res) => {
  const { yarn, allowDuplicate = false } = req.body || {};

  if (!yarn || typeof yarn !== 'object') {
    return res.status(400).json({ error: 'Yarn payload is required' });
  }

  const normalizedName = normalizeName(yarn.name || '');

  if (!normalizedName) {
    return res.status(400).json({ error: 'Yarn name is required' });
  }

  const existingCatalogYarn = getCatalogByNormalizedName(normalizedName);
  const alreadyOnUserList = existingCatalogYarn
    ? getEntriesByYarnId(existingCatalogYarn.id).length > 0
    : false;

  if (alreadyOnUserList && !allowDuplicate) {
    return res.status(409).json({
      error: 'Yarn already exists on the user list',
      existsInDatabase: true,
      alreadyOnUserList: true,
      yarnId: existingCatalogYarn.id,
      matchedName: existingCatalogYarn.name
    });
  }

  const catalogYarn = sanitizeCatalogYarn(yarn, existingCatalogYarn || {});
  yarnCatalog.set(catalogYarn.id, catalogYarn);

  const entry = createEntry(catalogYarn.id, yarn.status || DEFAULT_STATUS);
  res.status(201).json(buildJoinedYarn(entry));
});

app.put('/api/yarn/:id', (req, res) => {
  const entry = yarnEntries.get(req.params.id);

  if (!entry) {
    return res.status(404).json({ error: 'Yarn entry not found' });
  }

  const { yarn } = req.body || {};

  if (!yarn || typeof yarn !== 'object') {
    return res.status(400).json({ error: 'Yarn payload is required' });
  }

  const existingCatalogYarn = yarnCatalog.get(entry.yarnId);

  if (!existingCatalogYarn) {
    return res.status(404).json({ error: 'Catalog yarn not found' });
  }

  const normalizedName = normalizeName(yarn.name || existingCatalogYarn.name || '');

  if (!normalizedName) {
    return res.status(400).json({ error: 'Yarn name is required' });
  }

  const otherCatalogYarn = getCatalogByNormalizedName(normalizedName);
  const shouldRepointEntry = otherCatalogYarn && otherCatalogYarn.id !== existingCatalogYarn.id;
  const targetCatalogYarn = shouldRepointEntry
    ? sanitizeCatalogYarn(yarn, otherCatalogYarn)
    : sanitizeCatalogYarn(yarn, existingCatalogYarn);

  yarnCatalog.set(targetCatalogYarn.id, targetCatalogYarn);

  if (shouldRepointEntry) {
    entry.yarnId = targetCatalogYarn.id;
    yarnEntries.set(entry.id, entry);
    removeCatalogIfUnreferenced(existingCatalogYarn.id);
  }

  res.json(buildJoinedYarn(entry));
});

app.patch('/api/yarn/:id', (req, res) => {
  const entry = yarnEntries.get(req.params.id);

  if (!entry) {
    return res.status(404).json({ error: 'Yarn entry not found' });
  }

  const status = typeof req.body?.status === 'string' ? req.body.status : entry.status;
  const updatedEntry = {
    ...entry,
    status
  };

  yarnEntries.set(updatedEntry.id, updatedEntry);
  res.json(buildJoinedYarn(updatedEntry));
});

// Delete a yarn item by id
app.delete('/api/yarn/:id', (req, res) => {
  const entry = yarnEntries.get(req.params.id);

  if (!entry) {
    return res.status(404).json({ error: 'Yarn entry not found' });
  }

  yarnEntries.delete(entry.id);
  removeCatalogIfUnreferenced(entry.yarnId);

  res.json({ id: entry.id });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
