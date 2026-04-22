import { useState, useEffect } from 'react';
import AddYarn from './components/AddYarn';
import YarnList from './components/YarnList';
import { fetchPrice } from './api';
import { saveYarnList, loadYarnList } from './storage';

function App() {
  const [yarnList, setYarnList] = useState([]);

  useEffect(() => {
    const yarnList = loadYarnList();
    setYarnList(yarnList);
  }, []);

  const addYarn = async (yarn) => {
    const newYarn = { ...yarn };
    if (newYarn.priceSource === 'scraped') {
      try {
        const price = await fetchPrice(newYarn.url);
        newYarn.currentPrice = price;
        newYarn.lastChecked = new Date().toISOString();
      } catch (err) {
        console.error('Failed to fetch price:', err);
        // Optionally, show error to user
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
        const price = await fetchPrice(yarn.url);
        setYarnList(prev => {
          const newList = prev.map(y =>
            y.id === id
              ? { ...y, currentPrice: price, lastChecked: new Date().toISOString() }
              : y
          );
          saveYarnList(newList);
          return newList;
        });
      } catch (err) {
        console.error('Failed to refresh price:', err);
      }
    }
  };

  return (
    <div>
      <h1>Yarn Price Tracker</h1>
      <AddYarn onAddYarn={addYarn} />
      <YarnList yarnList={yarnList} onRefresh={refreshPrice} />
    </div>
  );
}

export default App;
