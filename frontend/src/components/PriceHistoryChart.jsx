const CHART_WIDTH = 720;
const CHART_HEIGHT = 240;
const CHART_PADDING = 24;

const formatTimestamp = (timestamp) => (
  new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
);

const buildPath = (points) => points.map((point, index) => (
  `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
)).join(' ');

const PriceHistoryChart = ({ priceHistory, lowestPriceAt }) => {
  if (!priceHistory?.length) {
    return (
      <div style={{ padding: '24px', border: '1px dashed var(--border-strong)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
        No recorded prices yet.
      </div>
    );
  }

  const numericValues = priceHistory.map((entry) => entry.numericPrice);
  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);
  const priceRange = maxValue - minValue || 1;
  const timeValues = priceHistory.map((entry) => new Date(entry.recordedAt).getTime());
  const minTime = Math.min(...timeValues);
  const maxTime = Math.max(...timeValues);
  const timeRange = maxTime - minTime || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const points = priceHistory.map((entry) => {
    const timeValue = new Date(entry.recordedAt).getTime();
    const x = CHART_PADDING + ((timeValue - minTime) / timeRange) * innerWidth;
    const y = CHART_HEIGHT - CHART_PADDING - ((entry.numericPrice - minValue) / priceRange) * innerHeight;

    return {
      ...entry,
      x,
      y,
      isLowest: entry.recordedAt === lowestPriceAt && entry.numericPrice === minValue
    };
  });

  const lowestPoint = points.find((point) => point.isLowest) || points[0];

  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '16px', backgroundColor: 'var(--surface-chart)' }}>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Price history chart" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <line x1={CHART_PADDING} y1={CHART_PADDING} x2={CHART_PADDING} y2={CHART_HEIGHT - CHART_PADDING} stroke="var(--chart-axis)" strokeWidth="1" />
        <line x1={CHART_PADDING} y1={CHART_HEIGHT - CHART_PADDING} x2={CHART_WIDTH - CHART_PADDING} y2={CHART_HEIGHT - CHART_PADDING} stroke="var(--chart-axis)" strokeWidth="1" />
        <path d={buildPath(points)} fill="none" stroke="var(--chart-line)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={point.isLowest ? 7 : 5}
            fill={point.isLowest ? 'var(--chart-low-point)' : 'var(--chart-point)'}
            stroke="var(--surface-card)"
            strokeWidth="2"
          />
        ))}
        <text x={CHART_PADDING} y={CHART_PADDING - 6} fill="var(--chart-label)" fontSize="14">
          ${maxValue.toFixed(2)}
        </text>
        <text x={CHART_PADDING} y={CHART_HEIGHT - 6} fill="var(--chart-label)" fontSize="14">
          ${minValue.toFixed(2)}
        </text>
        <text x={lowestPoint.x} y={Math.max(lowestPoint.y - 14, 14)} fill="var(--chart-low-label)" fontSize="14" textAnchor="middle">
          Lowest
        </text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
        <span>{formatTimestamp(priceHistory[0].recordedAt)}</span>
        <span>{formatTimestamp(priceHistory[priceHistory.length - 1].recordedAt)}</span>
      </div>
    </div>
  );
};

export default PriceHistoryChart;