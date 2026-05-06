// Basic Express server scaffold for yarn tracking service
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
