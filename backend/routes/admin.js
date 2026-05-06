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
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create user (Admin only) - FIXED VERSION
router.post('/users', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    console.log('=== Admin Creating User ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Role:', role);
    console.log('Raw password:', password);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Hash the password using the SAME method as signup
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    
    // Create user with hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'member'
    });
    
    await user.save();
    console.log('User saved successfully with hashed password');
    
    // Verify the password was saved correctly
    const savedUser = await User.findOne({ email });
    console.log('Verification - Password in DB:', savedUser.password);
    console.log('Verification - Password hash length:', savedUser.password.length);
    
    // Test if password matches
    const testMatch = await bcrypt.compare(password, savedUser.password);
    console.log('Test password match:', testMatch);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.deleteOne();
    console.log('User deleted:', user.email);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;