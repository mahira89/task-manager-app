const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE task
router.post('/', auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user.id });
    await task.save();
    res.json(task);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(task);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE task
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
