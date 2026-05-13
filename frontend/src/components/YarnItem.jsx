const YarnItem = ({ yarn, onRefresh, onMarkPurchased, onRestore, onDelete }) => {
  const handleDelete = () => {
    const confirmed = window.confirm('Delete this yarn permanently? This cannot be undone.');
    if (confirmed) {
      onDelete(yarn.id);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
      <h3>{yarn.name || 'Unnamed Yarn'}</h3>
      <p>Price: {yarn.currentPrice}</p>
      <p>Source: {yarn.priceSource}</p>
      <p>Last checked: {new Date(yarn.lastChecked).toLocaleString()}</p>
      {yarn.priceSource === 'scraped' && (
        <button onClick={() => onRefresh(yarn.id)}>Refresh Price</button>
      )}
      {onMarkPurchased && (
        <button onClick={() => onMarkPurchased(yarn.id)} style={{ marginLeft: '8px' }}>
          Mark Purchased
        </button>
      )}
      {onRestore && (
        <button onClick={() => onRestore(yarn.id)} style={{ marginLeft: '8px' }}>
          Restore To List
        </button>
      )}
      {onDelete && (
        <button onClick={handleDelete} style={{ marginLeft: '8px' }}>
          Delete
        </button>
      )}
    </div>
  );
};

export default YarnItem;
