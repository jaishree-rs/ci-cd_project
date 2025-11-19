const express = require('express');

const app = express();
const PORT = 8080;
const HOST = '0.0.0.0';

app.get('/', (req, res) => {
  res.send('<h1>Hello, World!</h1><p>CI/CD Pipeline on AWS is working!</p><p>Version: 3.0.0</p>');
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});