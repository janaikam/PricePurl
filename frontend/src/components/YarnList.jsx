const YarnList = ({ yarnList, onRefresh }) => {
  return (
    <div>
      <h2>Your Yarn List</h2>
      {yarnList.map(yarn => (
        <div key={yarn.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>{yarn.name || 'Unnamed Yarn'}</h3>
          <p>Price: {yarn.currentPrice}</p>
          <p>Source: {yarn.priceSource}</p>
          <p>Last checked: {new Date(yarn.lastChecked).toLocaleString()}</p>
          {yarn.priceSource === 'scraped' && (
            <button onClick={() => onRefresh(yarn.id)}>Refresh Price</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default YarnList;
