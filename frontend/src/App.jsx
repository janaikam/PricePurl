import { useState, useEffect } from 'react';
import AddYarn from './components/AddYarn';
import YarnList from './components/YarnList';
import { fetchProductInfo } from './api';
import { saveYarnList, loadYarnList } from './storage';

function App() {
  const [yarnList, setYarnList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const yarnList = loadYarnList();
    setYarnList(yarnList);
  }, []);

  const addYarn = async (yarn) => {
    setError('');
    const newYarn = { ...yarn };
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

  return (
    <div>
      <h1>Yarn Price Tracker</h1>
      {error && <div style={{ color: 'red', marginBottom: '1em' }}>{error}</div>}
      <AddYarn onAddYarn={addYarn} />
      <YarnList yarnList={yarnList} onRefresh={refreshPrice} />
    </div>
  );
}

export default App;
