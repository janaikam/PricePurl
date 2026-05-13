import { useEffect, useEffectEvent, useState } from 'react';
import AddYarn from './components/AddYarn';
import YarnDetail from './components/YarnDetail';
import YarnList from './components/YarnList';
import { fetchProductInfo } from './api';
import { saveYarnList, loadYarnList } from './storage';
import { parsePriceValue, updateYarnPrice } from './priceHistory';

const ACTIVE_STATUS = 'active';
const PURCHASED_STATUS = 'purchased';
const AUTO_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

function App() {
  const [yarnList, setYarnList] = useState(() => loadYarnList());
  const [error, setError] = useState('');
  const [selectedYarnId, setSelectedYarnId] = useState(null);

  const persistYarnList = (updater) => {
    setYarnList((prev) => {
      const nextList = updater(prev);
      saveYarnList(nextList);
      return nextList;
    });
  };

  const addYarn = async (yarn) => {
    setError('');
    const newYarn = { ...yarn, status: ACTIVE_STATUS };
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
        return;
      }
    }

    persistYarnList((prev) => [...prev, newYarn]);
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

      persistYarnList((prev) => prev.map((entry) => (
        entry.id === id
          ? updateYarnPrice(entry, {
              price: scraped.price,
              recordedAt: scraped.date || new Date().toISOString(),
              source: 'scraped',
              name: scraped.name || entry.name,
              siteName: scraped.siteName || entry.siteName,
              lastAutoRefreshAt: auto ? new Date().toISOString() : entry.lastAutoRefreshAt
            })
          : entry
      )));
    } catch (err) {
      if (!auto) {
        setError('Failed to refresh product info: ' + (err.message || err));
      }

      console.error('Failed to refresh product info:', err);
    }
  };

  const addManualPrice = (id, price) => {
    if (parsePriceValue(price) === null) {
      setError('Enter a valid manual price such as 5.49 or $5.49.');
      return false;
    }

    setError('');
    persistYarnList((prev) => prev.map((yarn) => (
      yarn.id === id
        ? updateYarnPrice(yarn, {
            price,
            recordedAt: new Date().toISOString(),
            source: 'manual'
          })
        : yarn
    )));

    return true;
  };

  const updateYarnStatus = (id, status) => {
    persistYarnList((prev) => (
      prev.map((yarn) => (
        yarn.id === id ? { ...yarn, status } : yarn
      ))
    ));
  };

  const markAsPurchased = (id) => {
    updateYarnStatus(id, PURCHASED_STATUS);
  };

  const restoreYarn = (id) => {
    updateYarnStatus(id, ACTIVE_STATUS);
  };

  const deleteYarn = (id) => {
    if (selectedYarnId === id) {
      setSelectedYarnId(null);
    }

    persistYarnList((prev) => prev.filter((yarn) => yarn.id !== id));
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
