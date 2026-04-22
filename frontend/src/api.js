export const fetchPrice = async (url) => {
  const response = await fetch('http://localhost:3001/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch price');
  }

  const data = await response.json();
  return data.price;
};
