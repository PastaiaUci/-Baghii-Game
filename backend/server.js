const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Farm game backend is running.'
  });
});

app.get('/', (req, res) => {
  res.send('Farm game backend is active.');
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
