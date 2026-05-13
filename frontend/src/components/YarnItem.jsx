const YarnItem = ({ yarn, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(yarn.id)}
      style={{
        display: 'block',
        width: '100%',
        border: '1px solid #ccc',
        padding: '10px',
        margin: '10px 0',
        textAlign: 'left',
        backgroundColor: '#fff',
        cursor: 'pointer'
      }}
    >
      <h3 style={{ margin: 0 }}>{yarn.name || 'Unnamed Yarn'}</h3>
    </button>
  );
};

export default YarnItem;
