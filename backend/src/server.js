const express = require('express');
const app = express();

app.use(express.json());

// Sign-in endpoint returning dummy data
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  res.status(200).json({
    status: 'success',
    token: 'dummy-jwt-token-abc-123',
    user: { id: 'u123', email: email, name: 'Test User' }
  });
});

// Sign-up endpoint returning dummy data
app.post('/api/signup', (req, res) => {
  const { username, email } = req.body;
  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    user: { id: 'u124', username, email }
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));