const YarnItem = ({ yarn, onRefresh }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
      <h3>{yarn.name || 'Unnamed Yarn'}</h3>
      <p>Price: {yarn.currentPrice}</p>
      <p>Source: {yarn.priceSource}</p>
      <p>Last checked: {new Date(yarn.lastChecked).toLocaleString()}</p>
      {yarn.priceSource === 'scraped' && (
        <button onClick={() => onRefresh(yarn.id)}>Refresh Price</button>
      )}
    </div>
  );
};

export default YarnItem;
