const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User exists' });
    }
    
    user = new User({ name, email, password });
    await user.save();
    
    const token = jwt.sign(
      { user: { id: user.id } },
      'secret123',
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user.id, name, email } });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { user: { id: user.id } },
      'secret123',
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user.id, name: user.name, email } });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
