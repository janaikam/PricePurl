import { useState } from 'react';
import { parsePriceValue } from '../priceHistory';

const AddYarn = ({ onAddYarn }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hasName = Boolean(name.trim());
    const hasUrl = Boolean(url.trim());
    const hasPrice = Boolean(price.trim());

    if (!hasUrl && (!hasName || !hasPrice)) {
      setError('Add a product URL to scrape automatically, or enter both a yarn name and current price manually.');
      return;
    }

    if (hasPrice && parsePriceValue(price) === null) {
      setError('Enter a valid price such as 5.49 or $5.49.');
      return;
    }

    if (regularPrice && parsePriceValue(regularPrice) === null) {
      setError('Enter a valid regular price such as 7.99 or $7.99.');
      return;
    }

    const yarn = {
      id: crypto.randomUUID(),
      name,
      url,
      lastChecked: new Date().toISOString(),
      regularPrice,
    };

    if (price) {
      yarn.currentPrice = price;
      yarn.priceSource = 'manual';
    } else {
      yarn.priceSource = 'scraped';
    }

    const didAdd = await onAddYarn(yarn);
    if (didAdd) {
      clearInputs();
    }
  };

  const clearInputs = () => {
    setName('');
    setUrl('');
    setPrice('');
    setRegularPrice('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ marginTop: 0 }}>
        Add a product URL to scrape details automatically, or enter both a name and current price manually.
      </p>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>URL:</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. hobbii.com/product"
        />
      </div>
      <div>
        <label>Current Price:</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. $5.49"
        />
      </div>
      <div>
        <label>Regular Price:</label>
        <input
          type="text"
          value={regularPrice}
          onChange={(e) => setRegularPrice(e.target.value)}
          placeholder="e.g. $7.99"
        />
      </div>
      {error && <p style={{ color: 'var(--status-error-text)' }}>{error}</p>}
      <button type="submit">Add Yarn</button>
    </form>
  );
};

export default AddYarn;
