import YarnItem from './YarnItem';

const YarnList = ({ title, emptyMessage, yarnList, onRefresh, onMarkPurchased, onRestore, onDelete }) => {
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
            onRefresh={onRefresh}
            onMarkPurchased={onMarkPurchased}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default YarnList;
