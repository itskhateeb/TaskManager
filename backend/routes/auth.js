const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    console.log('Signup attempt:', { name, email, role });
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'member' 
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('User found:', user.email, 'Role:', user.role);
    console.log('Stored password hash:', user.password);
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isValid);
    
    if (!isValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Login successful for:', email);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;