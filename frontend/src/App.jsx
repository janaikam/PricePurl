import { useEffect, useEffectEvent, useState } from 'react';
import AddYarn from './components/AddYarn';
import YarnDetail from './components/YarnDetail';
import YarnList from './components/YarnList';
import {
  checkYarnDuplicate,
  createYarnEntry,
  deleteYarnEntry,
  fetchProductInfo,
  fetchYarnList,
  updateYarnEntry,
  updateYarnEntryStatus,
} from './api';
import { parsePriceValue, updateYarnPrice } from './priceHistory';

const ACTIVE_STATUS = 'active';
const PURCHASED_STATUS = 'purchased';
const AUTO_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

function App() {
  const [yarnList, setYarnList] = useState([]);
  const [error, setError] = useState('');
  const [selectedYarnId, setSelectedYarnId] = useState(null);

  const loadYarnListFromApi = useEffectEvent(async () => {
    try {
      const nextYarnList = await fetchYarnList();
      setYarnList(nextYarnList);
    } catch (err) {
      setError('Failed to load yarn list: ' + (err.message || err));
    }
  });

  useEffect(() => {
    loadYarnListFromApi();
  }, []);

  const addYarn = async (yarn) => {
    setError('');
    const newYarn = {
      ...yarn,
      name: typeof yarn.name === 'string' ? yarn.name.trim() : '',
      status: ACTIVE_STATUS,
    };

    if (newYarn.priceSource === 'scraped') {
      try {
        const scraped = await fetchProductInfo(newYarn.url);
        if (!scraped.price || !scraped.name) {
          setError('Failed to scrape product info from the link.');
          return;
        }
        Object.assign(newYarn, updateYarnPrice(newYarn, {
          price: scraped.price,
          recordedAt: scraped.date || new Date().toISOString(),
          source: 'scraped',
          name: scraped.name || newYarn.name,
          siteName: scraped.siteName
        }));
      } catch (err) {
        setError('Failed to fetch product info: ' + (err.message || err));
        return false;
      }
    }

    if (!newYarn.name) {
      setError('A yarn name is required before the yarn can be added.');
      return false;
    }

    try {
      const duplicateCheck = await checkYarnDuplicate(newYarn.name);

      if (duplicateCheck.alreadyOnUserList) {
        const confirmed = window.confirm(`"${duplicateCheck.matchedName || newYarn.name}" is already on your yarn list. Add another instance anyway?`);

        if (!confirmed) {
          return false;
        }
      }

      const createdYarn = await createYarnEntry(newYarn, {
        allowDuplicate: duplicateCheck.alreadyOnUserList,
      });

      setYarnList((prev) => [...prev, createdYarn]);
      return true;
    } catch (err) {
      setError('Failed to add yarn: ' + (err.message || err));
      return false;
    }
  };

  const refreshPrice = async (id, { auto = false } = {}) => {
    const yarn = yarnList.find(y => y.id === id);
    if (!yarn || yarn.priceSource !== 'scraped') {
      return;
    }

    try {
      const scraped = await fetchProductInfo(yarn.url);
      if (!scraped.price) {
        throw new Error('Scraper returned no price.');
      }

      const updatedYarn = updateYarnPrice(yarn, {
        price: scraped.price,
        recordedAt: scraped.date || new Date().toISOString(),
        source: 'scraped',
        name: scraped.name || yarn.name,
        siteName: scraped.siteName || yarn.siteName,
        lastAutoRefreshAt: auto ? new Date().toISOString() : yarn.lastAutoRefreshAt,
      });
      const savedYarn = await updateYarnEntry(id, updatedYarn);

      setYarnList((prev) => prev.map((entry) => (
        entry.id === id ? savedYarn : entry
      )));
    } catch (err) {
      if (!auto) {
        setError('Failed to refresh product info: ' + (err.message || err));
      }

      console.error('Failed to refresh product info:', err);
    }
  };

  const addManualPrice = async (id, price) => {
    if (parsePriceValue(price) === null) {
      setError('Enter a valid manual price such as 5.49 or $5.49.');
      return false;
    }

    const yarn = yarnList.find((entry) => entry.id === id);
    if (!yarn) {
      setError('Unable to find that yarn entry.');
      return false;
    }

    setError('');

    try {
      const updatedYarn = updateYarnPrice(yarn, {
        price,
        recordedAt: new Date().toISOString(),
        source: 'manual',
      });
      const savedYarn = await updateYarnEntry(id, updatedYarn);

      setYarnList((prev) => prev.map((entry) => (
        entry.id === id ? savedYarn : entry
      )));

      return true;
    } catch (err) {
      setError('Failed to save manual price: ' + (err.message || err));
      return false;
    }
  };

  const updateYarnStatus = async (id, status) => {
    try {
      const savedYarn = await updateYarnEntryStatus(id, status);

      setYarnList((prev) => prev.map((yarn) => (
        yarn.id === id ? savedYarn : yarn
      )));
    } catch (err) {
      setError('Failed to update yarn status: ' + (err.message || err));
    }
  };

  const markAsPurchased = (id) => {
    void updateYarnStatus(id, PURCHASED_STATUS);
  };

  const restoreYarn = (id) => {
    void updateYarnStatus(id, ACTIVE_STATUS);
  };

  const deleteYarn = async (id) => {
    try {
      await deleteYarnEntry(id);

      if (selectedYarnId === id) {
        setSelectedYarnId(null);
      }

      setYarnList((prev) => prev.filter((yarn) => yarn.id !== id));
    } catch (err) {
      setError('Failed to delete yarn: ' + (err.message || err));
    }
  };

  const runAutoRefresh = useEffectEvent(() => {
    const scrapedYarns = yarnList.filter((yarn) => yarn.priceSource === 'scraped' && yarn.url);
    scrapedYarns.forEach((yarn) => {
      refreshPrice(yarn.id, { auto: true });
    });
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      runAutoRefresh();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeYarnList = yarnList.filter((yarn) => yarn.status !== PURCHASED_STATUS);
  const purchasedYarnList = yarnList.filter((yarn) => yarn.status === PURCHASED_STATUS);
  const selectedYarn = yarnList.find((yarn) => yarn.id === selectedYarnId) || null;

  return (
    <div>
      <h1>Yarn Price Tracker</h1>
      {error && <div style={{ color: 'red', marginBottom: '1em' }}>{error}</div>}
      {selectedYarn ? (
        <YarnDetail
          yarn={selectedYarn}
          onBack={() => setSelectedYarnId(null)}
          onRefresh={refreshPrice}
          onAddManualPrice={addManualPrice}
          onMarkPurchased={markAsPurchased}
          onRestore={restoreYarn}
          onDelete={deleteYarn}
        />
      ) : (
        <>
          <AddYarn onAddYarn={addYarn} />
          <YarnList
            title="Your Yarn List"
            emptyMessage="No yarns in your active list yet."
            yarnList={activeYarnList}
            onSelectYarn={setSelectedYarnId}
          />
          <YarnList
            title="Purchased Yarn"
            emptyMessage="No purchased yarn is hidden right now."
            yarnList={purchasedYarnList}
            onSelectYarn={setSelectedYarnId}
          />
        </>
      )}
    </div>
  );
}

export default App;
