const YarnDetail = ({ yarn, onBack, onRefresh, onMarkPurchased, onRestore, onDelete }) => {
  const handleDelete = () => {
    const confirmed = window.confirm('Delete this yarn permanently? This cannot be undone.');
    if (confirmed) {
      onDelete(yarn.id);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginTop: '16px' }}>
      <button type="button" onClick={onBack} style={{ marginBottom: '16px' }}>
        Back To Yarn List
      </button>
      <h2 style={{ marginTop: 0 }}>{yarn.name || 'Unnamed Yarn'}</h2>
      <p>Current Price: {yarn.currentPrice || 'Not available'}</p>
      <p>Source: {yarn.priceSource}</p>
      <p>Last checked: {new Date(yarn.lastChecked).toLocaleString()}</p>
      {yarn.priceSource === 'scraped' && (
        <button type="button" onClick={() => onRefresh(yarn.id)}>
          Refresh Price
        </button>
      )}
      {yarn.status === 'active' && (
        <button type="button" onClick={() => onMarkPurchased(yarn.id)} style={{ marginLeft: '8px' }}>
          Mark Purchased
        </button>
      )}
      {yarn.status === 'purchased' && (
        <button type="button" onClick={() => onRestore(yarn.id)} style={{ marginLeft: '8px' }}>
          Restore To List
        </button>
      )}
      <button type="button" onClick={handleDelete} style={{ marginLeft: '8px' }}>
        Delete
      </button>
    </div>
  );
};

export default YarnDetail;