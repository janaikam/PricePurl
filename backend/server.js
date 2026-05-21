const { randomUUID } = require('node:crypto');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DEFAULT_USER_ID = process.env.SUPABASE_DEFAULT_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

if (!SUPABASE_DEFAULT_USER_ID) {
  throw new Error('SUPABASE_DEFAULT_USER_ID is required until auth is implemented.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

app.use(cors());
app.use(express.json());

const DEFAULT_STATUS = 'active';
const DEFAULT_SOURCE = 'manual';

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
  id = randomUUID(),
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
    numericPrice,
  };
};

const buildInitialPriceHistory = ({ currentPrice, lastChecked, priceSource }) => {
  const initialEntry = createPriceHistoryEntry({
    price: currentPrice,
    recordedAt: lastChecked,
    source: priceSource,
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
      lastChecked: null,
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
    lastChecked: currentEntry.recordedAt,
  };
};

const sanitizeCatalogYarn = (item = {}, existing = {}) => {
  const trimmedName = typeof item.name === 'string' ? item.name.trim() : '';
  const fallbackLastChecked = item.lastChecked ?? existing.lastChecked ?? new Date().toISOString();
  const fallbackPriceSource = item.priceSource || existing.priceSource || DEFAULT_SOURCE;
  const regularPriceValue = parsePriceValue(
    item.regularPriceValue ?? item.regularPrice ?? existing.regularPriceValue ?? existing.regularPrice
  );
  const priceHistory = Array.isArray(item.priceHistory)
    ? (item.priceHistory.length > 0
        ? item.priceHistory
        : buildInitialPriceHistory({
            currentPrice: item.currentPrice,
            lastChecked: fallbackLastChecked,
            priceSource: fallbackPriceSource,
          }))
    : (existing.priceHistory?.length
        ? existing.priceHistory
        : buildInitialPriceHistory({
            currentPrice: item.currentPrice ?? existing.currentPrice,
            lastChecked: fallbackLastChecked,
            priceSource: fallbackPriceSource,
          }));
  const derivedMetadata = derivePriceMetadata(priceHistory);

  return {
    id: existing.id || item.id || randomUUID(),
    normalizedName: normalizeName(trimmedName),
    name: trimmedName,
    url: typeof item.url === 'string' ? item.url : existing.url || '',
    currentPrice: derivedMetadata.currentPrice || (item.currentPrice ?? existing.currentPrice ?? ''),
    currentPriceValue:
      derivedMetadata.currentPriceValue ?? item.currentPriceValue ?? existing.currentPriceValue ?? null,
    lastChecked: derivedMetadata.lastChecked || fallbackLastChecked,
    lastAutoRefreshAt: item.lastAutoRefreshAt ?? existing.lastAutoRefreshAt ?? null,
    lowestPrice: derivedMetadata.lowestPrice || (item.lowestPrice ?? existing.lowestPrice ?? ''),
    lowestPriceValue:
      derivedMetadata.lowestPriceValue ?? item.lowestPriceValue ?? existing.lowestPriceValue ?? null,
    lowestPriceAt: derivedMetadata.lowestPriceAt || (item.lowestPriceAt ?? existing.lowestPriceAt ?? null),
    priceHistory,
    priceSource: fallbackPriceSource,
    regularPrice: regularPriceValue === null ? '' : normalizeDisplayPrice(regularPriceValue),
    regularPriceValue,
    siteName: typeof item.siteName === 'string' ? item.siteName : (existing.siteName || ''),
  };
};

const mapCatalogRow = (row = {}) => ({
  id: row.id,
  normalizedName: row.normalized_name,
  name: row.name,
  url: row.url,
  currentPrice: row.current_price,
  currentPriceValue: row.current_price_value,
  lastChecked: row.last_checked,
  lastAutoRefreshAt: row.last_auto_refresh_at,
  lowestPrice: row.lowest_price,
  lowestPriceValue: row.lowest_price_value,
  lowestPriceAt: row.lowest_price_at,
  priceHistory: Array.isArray(row.price_history) ? row.price_history : [],
  priceSource: row.price_source,
  regularPrice: row.regular_price,
  regularPriceValue: row.regular_price_value,
  siteName: row.site_name,
});

const mapCatalogToRow = (item = {}) => ({
  id: item.id,
  normalized_name: item.normalizedName,
  name: item.name,
  url: item.url,
  current_price: item.currentPrice,
  current_price_value: item.currentPriceValue,
  last_checked: item.lastChecked,
  last_auto_refresh_at: item.lastAutoRefreshAt,
  lowest_price: item.lowestPrice,
  lowest_price_value: item.lowestPriceValue,
  lowest_price_at: item.lowestPriceAt,
  price_history: item.priceHistory,
  price_source: item.priceSource,
  regular_price: item.regularPrice,
  regular_price_value: item.regularPriceValue,
  site_name: item.siteName,
});

const mapEntryRow = (row = {}) => ({
  id: row.id,
  userId: row.user_id,
  yarnId: row.yarn_id,
  status: row.status,
});

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const requireSupabaseResult = (result, fallbackMessage) => {
  if (result.error) {
    throw createHttpError(500, result.error.message || fallbackMessage);
  }

  return result.data;
};

const getCatalogByNormalizedName = async (normalizedName) => {
  const result = await supabase
    .from('yarn_catalog')
    .select('*')
    .eq('normalized_name', normalizedName)
    .maybeSingle();

  const data = requireSupabaseResult(result, 'Failed to load catalog yarn');
  return data ? mapCatalogRow(data) : null;
};

const getCatalogById = async (id) => {
  const result = await supabase
    .from('yarn_catalog')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const data = requireSupabaseResult(result, 'Failed to load catalog yarn');
  return data ? mapCatalogRow(data) : null;
};

const getCatalogByIds = async (ids) => {
  if (!ids.length) {
    return new Map();
  }

  const result = await supabase
    .from('yarn_catalog')
    .select('*')
    .in('id', ids);

  const rows = requireSupabaseResult(result, 'Failed to load catalog yarns');
  return new Map(rows.map((row) => [row.id, mapCatalogRow(row)]));
};

const getEntriesByYarnId = async (yarnId) => {
  const result = await supabase
    .from('user_yarn_entries')
    .select('*')
    .eq('user_id', SUPABASE_DEFAULT_USER_ID)
    .eq('yarn_id', yarnId)
    .order('created_at', { ascending: true });

  return requireSupabaseResult(result, 'Failed to load yarn entries').map(mapEntryRow);
};

const getEntryById = async (id) => {
  const result = await supabase
    .from('user_yarn_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', SUPABASE_DEFAULT_USER_ID)
    .maybeSingle();

  const data = requireSupabaseResult(result, 'Failed to load yarn entry');
  return data ? mapEntryRow(data) : null;
};

const listJoinedYarns = async () => {
  const entryResult = await supabase
    .from('user_yarn_entries')
    .select('*')
    .eq('user_id', SUPABASE_DEFAULT_USER_ID)
    .order('created_at', { ascending: true });
  const entries = requireSupabaseResult(entryResult, 'Failed to load yarn list').map(mapEntryRow);
  const catalogById = await getCatalogByIds([...new Set(entries.map((entry) => entry.yarnId))]);

  return entries.map((entry) => buildJoinedYarn(entry, catalogById.get(entry.yarnId))).filter(Boolean);
};

const upsertCatalogYarn = async (catalogYarn) => {
  const result = await supabase
    .from('yarn_catalog')
    .upsert(mapCatalogToRow(catalogYarn), { onConflict: 'id' })
    .select('*')
    .single();

  return mapCatalogRow(requireSupabaseResult(result, 'Failed to save catalog yarn'));
};

const updateEntryYarnId = async (entryId, yarnId) => {
  const result = await supabase
    .from('user_yarn_entries')
    .update({ yarn_id: yarnId })
    .eq('id', entryId)
    .eq('user_id', SUPABASE_DEFAULT_USER_ID)
    .select('*')
    .single();

  return mapEntryRow(requireSupabaseResult(result, 'Failed to update yarn entry'));
};

const updateEntryStatus = async (entryId, status) => {
  const result = await supabase
    .from('user_yarn_entries')
    .update({ status })
    .eq('id', entryId)
    .eq('user_id', SUPABASE_DEFAULT_USER_ID)
    .select('*')
    .single();

  return mapEntryRow(requireSupabaseResult(result, 'Failed to update yarn entry'));
};

const removeCatalogIfUnreferenced = async (yarnId) => {
  const result = await supabase
    .from('user_yarn_entries')
    .select('id', { count: 'exact', head: true })
    .eq('yarn_id', yarnId);

  requireSupabaseResult(result, 'Failed to check yarn references');

  if ((result.count || 0) === 0) {
    const deleteResult = await supabase
      .from('yarn_catalog')
      .delete()
      .eq('id', yarnId);

    requireSupabaseResult(deleteResult, 'Failed to remove catalog yarn');
  }
};

const createEntry = async (yarnId, status = DEFAULT_STATUS) => {
  const result = await supabase
    .from('user_yarn_entries')
    .insert({
      id: randomUUID(),
      user_id: SUPABASE_DEFAULT_USER_ID,
      yarn_id: yarnId,
      status,
    })
    .select('*')
    .single();

  return mapEntryRow(requireSupabaseResult(result, 'Failed to create yarn entry'));
};

const deleteEntry = async (entryId) => {
  const result = await supabase
    .from('user_yarn_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', SUPABASE_DEFAULT_USER_ID);

  requireSupabaseResult(result, 'Failed to delete yarn entry');
};

const buildJoinedYarn = (entry, catalogYarn) => {
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
    siteName: catalogYarn.siteName,
  };
};

// Scrape endpoint: calls Java scraper-service and returns product info
app.post('/scrape', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  fetch('http://127.0.0.1:3002/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data && data.name && data.price) {
        res.json({
          name: data.name,
          price: data.price,
          regularPrice: data.regularPrice,
          siteName: data.siteName,
          date: data.date,
        });
      } else {
        res.status(500).json({ error: 'Failed to scrape product info' });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: 'Scraper service error', details: error.message });
    });
});

app.get('/api/yarn', async (req, res) => {
  try {
    res.json(await listJoinedYarns());
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to load yarn list' });
  }
});

app.get('/api/yarn/check', async (req, res) => {
  const normalizedName = normalizeName(req.query.name || '');

  if (!normalizedName) {
    return res.status(400).json({ error: 'Yarn name is required' });
  }

  try {
    const catalogYarn = await getCatalogByNormalizedName(normalizedName);
    const matchingEntries = catalogYarn ? await getEntriesByYarnId(catalogYarn.id) : [];

    res.json({
      existsInDatabase: Boolean(catalogYarn),
      alreadyOnUserList: matchingEntries.length > 0,
      yarnId: catalogYarn?.id || null,
      matchedName: catalogYarn?.name || null,
      matchingEntryIds: matchingEntries.map((entry) => entry.id),
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to check for duplicate yarns' });
  }
});

app.post('/api/yarn', async (req, res) => {
  const { yarn, allowDuplicate = false } = req.body || {};

  if (!yarn || typeof yarn !== 'object') {
    return res.status(400).json({ error: 'Yarn payload is required' });
  }

  const normalizedName = normalizeName(yarn.name || '');

  if (!normalizedName) {
    return res.status(400).json({ error: 'Yarn name is required' });
  }

  try {
    const existingCatalogYarn = await getCatalogByNormalizedName(normalizedName);
    const alreadyOnUserList = existingCatalogYarn
      ? (await getEntriesByYarnId(existingCatalogYarn.id)).length > 0
      : false;

    if (alreadyOnUserList && !allowDuplicate) {
      return res.status(409).json({
        error: 'Yarn already exists on the user list',
        existsInDatabase: true,
        alreadyOnUserList: true,
        yarnId: existingCatalogYarn.id,
        matchedName: existingCatalogYarn.name,
      });
    }

    const catalogYarn = await upsertCatalogYarn(sanitizeCatalogYarn(yarn, existingCatalogYarn || {}));
    const entry = await createEntry(catalogYarn.id, yarn.status || DEFAULT_STATUS);
    res.status(201).json(buildJoinedYarn(entry, catalogYarn));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to add yarn' });
  }
});

app.put('/api/yarn/:id', async (req, res) => {
  const { yarn } = req.body || {};

  if (!yarn || typeof yarn !== 'object') {
    return res.status(400).json({ error: 'Yarn payload is required' });
  }

  try {
    const entry = await getEntryById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Yarn entry not found' });
    }

    const existingCatalogYarn = await getCatalogById(entry.yarnId);

    if (!existingCatalogYarn) {
      return res.status(404).json({ error: 'Catalog yarn not found' });
    }

    const normalizedName = normalizeName(yarn.name || existingCatalogYarn.name || '');

    if (!normalizedName) {
      return res.status(400).json({ error: 'Yarn name is required' });
    }

    const otherCatalogYarn = await getCatalogByNormalizedName(normalizedName);
    const shouldRepointEntry = otherCatalogYarn && otherCatalogYarn.id !== existingCatalogYarn.id;
    const targetCatalogYarn = await upsertCatalogYarn(
      sanitizeCatalogYarn(yarn, shouldRepointEntry ? otherCatalogYarn : existingCatalogYarn)
    );
    const updatedEntry = shouldRepointEntry
      ? await updateEntryYarnId(entry.id, targetCatalogYarn.id)
      : entry;

    if (shouldRepointEntry) {
      await removeCatalogIfUnreferenced(existingCatalogYarn.id);
    }

    res.json(buildJoinedYarn(updatedEntry, targetCatalogYarn));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to update yarn' });
  }
});

app.patch('/api/yarn/:id', async (req, res) => {
  try {
    const entry = await getEntryById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Yarn entry not found' });
    }

    const status = typeof req.body?.status === 'string' ? req.body.status : entry.status;
    const updatedEntry = await updateEntryStatus(entry.id, status);
    const catalogYarn = await getCatalogById(updatedEntry.yarnId);

    res.json(buildJoinedYarn(updatedEntry, catalogYarn));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to update yarn status' });
  }
});

app.delete('/api/yarn/:id', async (req, res) => {
  try {
    const entry = await getEntryById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'Yarn entry not found' });
    }

    await deleteEntry(entry.id);
    await removeCatalogIfUnreferenced(entry.yarnId);

    res.json({ id: entry.id });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to delete yarn' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
