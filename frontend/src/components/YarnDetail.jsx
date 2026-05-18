import { useState } from 'react';
import PriceHistoryChart from './PriceHistoryChart';
import { derivePriceStatus, parsePriceValue } from '../priceHistory';

const sectionStyle = {
  border: '1px solid #d7c2ba',
  borderRadius: '18px',
  padding: '18px',
  backgroundColor: '#fff'
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return 'Not available';
  }

  return new Date(timestamp).toLocaleString();
};

const YarnDetail = ({ yarn, onBack, onRefresh, onAddManualPrice, onUpdateRegularPrice, onMarkPurchased, onRestore, onDelete }) => {
  const [manualPrice, setManualPrice] = useState('');
  const [manualError, setManualError] = useState('');
  const [regularPrice, setRegularPrice] = useState(yarn.regularPrice || '');
  const [regularPriceError, setRegularPriceError] = useState('');
  const { isOnSale, isAtHistoricalLow } = derivePriceStatus(yarn);

  const handleDelete = () => {
    const confirmed = window.confirm('Delete this yarn permanently? This cannot be undone.');
    if (confirmed) {
      onDelete(yarn.id);
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setManualError('');

    if (!manualPrice.trim()) {
      setManualError('Enter a price to record.');
      return;
    }

    if (parsePriceValue(manualPrice) === null) {
      setManualError('Enter a valid price such as 5.49 or $5.49.');
      return;
    }

    const didSave = await onAddManualPrice(yarn.id, manualPrice);
    if (didSave) {
      setManualPrice('');
    }
  };

  const handleRegularPriceSubmit = async (event) => {
    event.preventDefault();
    setRegularPriceError('');

    if (!regularPrice.trim()) {
      setRegularPriceError('Enter a regular price to save.');
      return;
    }

    if (parsePriceValue(regularPrice) === null) {
      setRegularPriceError('Enter a valid regular price such as 7.99 or $7.99.');
      return;
    }

    const didSave = await onUpdateRegularPrice(yarn.id, regularPrice);
    if (!didSave) {
      setRegularPriceError('Could not save the regular price.');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '24px auto', textAlign: 'left', padding: '0 16px 32px' }}>
      <button type="button" onClick={onBack} style={{ marginBottom: '16px', borderRadius: '999px', border: '1px solid #d7c2ba', padding: '10px 14px', backgroundColor: '#fff7f3' }}>
        Back To Yarn List
      </button>
      <div style={{ ...sectionStyle, marginBottom: '20px', background: 'linear-gradient(135deg, #fff4ef 0%, #fefaf4 100%)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '12px' }}>{yarn.name || 'Unnamed Yarn'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d645d' }}>Current price</div>
            <div style={{ fontSize: '1.8rem', color: '#2f2a28' }}>{yarn.currentPrice || 'Not available'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d645d' }}>Cheapest price</div>
            <div style={{ fontSize: '1.8rem', color: '#2f2a28' }}>{yarn.lowestPrice || 'Not available'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d645d' }}>Last that cheap</div>
            <div style={{ fontSize: '1rem', color: '#2f2a28' }}>{formatTimestamp(yarn.lowestPriceAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d645d' }}>Last checked</div>
            <div style={{ fontSize: '1rem', color: '#2f2a28' }}>{formatTimestamp(yarn.lastChecked)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7d645d' }}>Regular price</div>
            <div style={{ fontSize: '1rem', color: '#2f2a28' }}>{yarn.regularPrice || 'Not set'}</div>
          </div>
        </div>
        {(isOnSale || isAtHistoricalLow) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {isOnSale && <span style={{ borderRadius: '999px', padding: '6px 12px', backgroundColor: '#dff4ea', color: '#17624a', fontWeight: 600 }}>On Sale</span>}
            {isAtHistoricalLow && <span style={{ borderRadius: '999px', padding: '6px 12px', backgroundColor: '#fff1d7', color: '#8f5b00', fontWeight: 600 }}>Historical Low</span>}
          </div>
        )}
        <p style={{ marginBottom: '8px' }}>Source: {yarn.priceSource}</p>
        {yarn.url && (
          <a
            href={yarn.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              borderRadius: '999px',
              border: 'none',
              padding: '10px 16px',
              backgroundColor: '#c94f3d',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Buy Now
          </a>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {yarn.priceSource === 'scraped' && (
            <button type="button" onClick={() => onRefresh(yarn.id)} style={{ borderRadius: '999px', border: 'none', padding: '10px 16px', backgroundColor: '#1f6f5f', color: '#fff' }}>
              Refresh Price
            </button>
          )}
          {yarn.status === 'active' && (
            <button type="button" onClick={() => onMarkPurchased(yarn.id)} style={{ borderRadius: '999px', border: '1px solid #d7c2ba', padding: '10px 16px', backgroundColor: '#fff' }}>
              Mark Purchased
            </button>
          )}
          {yarn.status === 'purchased' && (
            <button type="button" onClick={() => onRestore(yarn.id)} style={{ borderRadius: '999px', border: '1px solid #d7c2ba', padding: '10px 16px', backgroundColor: '#fff' }}>
              Restore To List
            </button>
          )}
          <button type="button" onClick={handleDelete} style={{ borderRadius: '999px', border: '1px solid #c94f3d', padding: '10px 16px', backgroundColor: '#fff', color: '#8f2d1e' }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ ...sectionStyle, marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2f2a28' }}>Price History</h3>
        <PriceHistoryChart priceHistory={yarn.priceHistory} lowestPriceAt={yarn.lowestPriceAt} />
      </div>

      {yarn.priceSource === 'manual' && (
        <div style={{ ...sectionStyle, marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#2f2a28' }}>Record Manual Price Change</h3>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
            <input
              type="text"
              value={manualPrice}
              onChange={(event) => setManualPrice(event.target.value)}
              placeholder="e.g. $5.49"
              style={{ flex: '1 1 220px', borderRadius: '12px', border: '1px solid #d7c2ba', padding: '12px' }}
            />
            <button type="submit" style={{ borderRadius: '999px', border: 'none', padding: '12px 18px', backgroundColor: '#c94f3d', color: '#fff' }}>
              Add Price Point
            </button>
          </form>
          {manualError && <p style={{ marginTop: '10px', color: '#8f2d1e' }}>{manualError}</p>}
        </div>
      )}

      <div style={{ ...sectionStyle, marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#2f2a28' }}>Set Regular Price</h3>
        <form onSubmit={handleRegularPriceSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start' }}>
          <input
            type="text"
            value={regularPrice}
            onChange={(event) => setRegularPrice(event.target.value)}
            placeholder="e.g. $7.99"
            style={{ flex: '1 1 220px', borderRadius: '12px', border: '1px solid #d7c2ba', padding: '12px' }}
          />
          <button type="submit" style={{ borderRadius: '999px', border: 'none', padding: '12px 18px', backgroundColor: '#1f6f5f', color: '#fff' }}>
            Save Regular Price
          </button>
        </form>
        {regularPriceError && <p style={{ marginTop: '10px', color: '#8f2d1e' }}>{regularPriceError}</p>}
      </div>

      <div style={{ ...sectionStyle }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#2f2a28' }}>Recent Price Points</h3>
        {yarn.priceHistory?.length ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {[...yarn.priceHistory].reverse().map((entry) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid #f0dfd9' }}>
                <span>{entry.displayPrice}</span>
                <span style={{ color: '#7d645d' }}>{formatTimestamp(entry.recordedAt)}</span>
                <span style={{ color: '#7d645d', textTransform: 'capitalize' }}>{entry.source}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>No prices recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default YarnDetail;