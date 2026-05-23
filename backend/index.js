const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];
const tasks = [];
let taskId = 1;

// Helper function to verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, 'secret123');
  } catch (err) {
    return null;
  }
};

// Middleware to check auth
const authMiddleware = (req, res, next) => {
  const token = req.headers['x-auth-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.userId = decoded.userId;
  next();
};

// REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
  console.log('Register request:', req.body);
  
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword
    };
    users.push(user);
    
    // Create token
    const token = jwt.sign({ userId: user.id }, 'secret123', { expiresIn: '7d' });
    
    // Send response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request:', req.body.email);
  
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign({ userId: user.id }, 'secret123', { expiresIn: '7d' });
    
    // Send response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET CURRENT USER
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

// GET ALL TASKS
app.get('/api/tasks', authMiddleware, (req, res) => {
  const userTasks = tasks.filter(t => t.userId === req.userId);
  res.json(userTasks);
});

// CREATE TASK
app.post('/api/tasks', authMiddleware, (req, res) => {
  const task = {
    id: taskId++,
    ...req.body,
    userId: req.userId,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  res.json(task);
});

// UPDATE TASK
app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.userId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
  res.json(tasks[taskIndex]);
});

// DELETE TASK
app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.userId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks.splice(taskIndex, 1);
  res.json({ message: 'Task deleted successfully' });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 In-memory storage - users: ${users.length}, tasks: ${tasks.length}`);
});
