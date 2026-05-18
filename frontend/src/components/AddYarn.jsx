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

    if (!name.trim() && !url) {
      setError('Enter a yarn name or provide a URL to scrape.');
      return;
    }

    if (!url && !price) {
      setError('At least one of URL or price must be provided.');
      return;
    }

    if (price && parsePriceValue(price) === null) {
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
      <div>
        <label>Name (optional):</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>URL (optional):</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div>
        <label>Price (optional):</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div>
        <label>Regular Price (optional):</label>
        <input
          type="text"
          value={regularPrice}
          onChange={(e) => setRegularPrice(e.target.value)}
          placeholder="e.g. $7.99"
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Add Yarn</button>
    </form>
  );
};

export default AddYarn;
