import { derivePriceStatus } from '../priceHistory';

const badgeStyle = {
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase'
};

const YarnItem = ({ yarn, onSelect }) => {
  const { isOnSale, isAtHistoricalLow } = derivePriceStatus(yarn);
  const statusLabel = isOnSale ? 'On Sale' : (isAtHistoricalLow ? 'Historical Low' : 'View Details');

  return (
    <button
      type="button"
      onClick={() => onSelect(yarn.id)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        border: '1px solid #d7c2ba',
        borderRadius: '16px',
        padding: '14px 16px',
        margin: '10px 0',
        textAlign: 'left',
        backgroundColor: '#fffaf8',
        cursor: 'pointer'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: 0, color: '#2f2a28' }}>{yarn.name || 'Unnamed Yarn'}</h3>
        <div style={{ marginTop: '6px', color: '#7d645d', fontSize: '0.92rem' }}>
          {yarn.currentPrice || 'Price unavailable'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {(isOnSale || isAtHistoricalLow) && (
          <span
            style={{
              ...badgeStyle,
              backgroundColor: isOnSale ? '#dff4ea' : '#fff1d7',
              color: isOnSale ? '#17624a' : '#8f5b00'
            }}
          >
            {statusLabel}
          </span>
        )}
        <span style={{ color: '#7d645d', fontWeight: 600, whiteSpace: 'nowrap' }}>
          View ›
        </span>
      </div>
    </button>
  );
};

export default YarnItem;
