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
  const statusLabel = isAtHistoricalLow ? 'Historical Low' : (isOnSale ? 'On Sale' : 'View Details');

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
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '14px 16px',
        margin: '10px 0',
        textAlign: 'left',
        backgroundColor: 'var(--surface-card)',
        boxShadow: 'var(--shadow-soft)',
        cursor: 'pointer'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{yarn.name || 'Unnamed Yarn'}</h3>
        <div style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          {yarn.currentPrice || 'Price unavailable'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {(isOnSale || isAtHistoricalLow) && (
          <span
            style={{
              ...badgeStyle,
              backgroundColor: isAtHistoricalLow ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
              color: isAtHistoricalLow ? 'var(--status-warning-text)' : 'var(--status-success-text)'
            }}
          >
            {statusLabel}
          </span>
        )}
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          View ›
        </span>
      </div>
    </button>
  );
};

export default YarnItem;
