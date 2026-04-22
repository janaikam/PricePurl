import YarnItem from './YarnItem';

const YarnList = ({ yarnList, onRefresh }) => {
  return (
    <div>
      <h2>Your Yarn List</h2>
      {yarnList.map(yarn => (
        <YarnItem key={yarn.id} yarn={yarn} onRefresh={onRefresh} />
      ))}
    </div>
  );
};

export default YarnList;
