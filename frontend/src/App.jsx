import { useState } from 'react';
import AddYarn from './components/AddYarn';
import YarnDetail from './components/YarnDetail';
import YarnList from './components/YarnList';
import { fetchProductInfo } from './api';
import { saveYarnList, loadYarnList } from './storage';

const ACTIVE_STATUS = 'active';
const PURCHASED_STATUS = 'purchased';

function App() {
  const [yarnList, setYarnList] = useState(() => loadYarnList());
  const [error, setError] = useState('');
  const [selectedYarnId, setSelectedYarnId] = useState(null);

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
        newYarn.currentPrice = scraped.price;
        newYarn.name = scraped.name || newYarn.name;
        newYarn.siteName = scraped.siteName;
        newYarn.lastChecked = scraped.date || new Date().toISOString();
      } catch (err) {
        setError('Failed to fetch product info: ' + (err.message || err));
        return;
      }
    }
    setYarnList(prev => {
      const newList = [...prev, newYarn];
      saveYarnList(newList);
      return newList;
    });
  };

  const refreshPrice = async (id) => {
    const yarn = yarnList.find(y => y.id === id);
    if (yarn && yarn.priceSource === 'scraped') {
      try {
        const scraped = await fetchProductInfo(yarn.url);
        setYarnList(prev => {
          const newList = prev.map(y =>
            y.id === id
              ? { ...y, currentPrice: scraped.price, name: scraped.name || y.name, siteName: scraped.siteName, lastChecked: scraped.date || new Date().toISOString() }
              : y
          );
          saveYarnList(newList);
          return newList;
        });
      } catch (err) {
        console.error('Failed to refresh product info:', err);
      }
    }
  };

  const updateYarnStatus = (id, status) => {
    setYarnList((prev) => {
      const newList = prev.map((yarn) => (
        yarn.id === id ? { ...yarn, status } : yarn
      ));
      saveYarnList(newList);
      return newList;
    });
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

    setYarnList((prev) => {
      const newList = prev.filter((yarn) => yarn.id !== id);
      saveYarnList(newList);
      return newList;
    });
  };

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
