const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Scrape endpoint: calls Java scraper-service and returns product info
app.post('/scrape', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  // Call Java scraper-service via HTTP
  fetch('http://127.0.0.1:3002/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
    .then(r => r.json())
    .then(data => {
      if (data && data.name && data.price) {
        res.json({ name: data.name, price: data.price, siteName: data.siteName, date: data.date });
      } else {
        res.status(500).json({ error: 'Failed to scrape product info' });
      }
    })
    .catch(e => {
      res.status(500).json({ error: 'Scraper service error', details: e.message });
    });
});
// In-memory data store for yarn items
let yarnItems = [];

// Get all yarn items
app.get('/api/yarn', (req, res) => {
  res.json(yarnItems);
});

// Add a new yarn item
app.post('/api/yarn', (req, res) => {
  const { name, color, brand, price, url } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Yarn name is required' });
  }
  const newYarn = {
    id: Date.now().toString(),
    name,
    color,
    brand,
    price,
    url
  };
  yarnItems.push(newYarn);
  res.status(201).json(newYarn);
});

// Delete a yarn item by id
app.delete('/api/yarn/:id', (req, res) => {
  const { id } = req.params;
  const index = yarnItems.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Yarn item not found' });
  }
  const deleted = yarnItems.splice(index, 1);
  res.json(deleted[0]);
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
