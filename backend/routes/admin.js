const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
router.get('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (Admin only)
router.post('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'member'
    });
    
    await user.save();
    res.status(201).json({ message: 'User created successfully', user: { id: user._id, name, email, role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;