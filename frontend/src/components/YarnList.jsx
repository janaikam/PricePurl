import YarnItem from './YarnItem';

const YarnList = ({ title, emptyMessage, yarnList, onSelectYarn }) => {
  return (
    <div>
      <h2>{title}</h2>
      {yarnList.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        yarnList.map((yarn) => (
          <YarnItem
            key={yarn.id}
            yarn={yarn}
            onSelect={onSelectYarn}
          />
        ))
      )}
    </div>
  );
};

export default YarnList;
