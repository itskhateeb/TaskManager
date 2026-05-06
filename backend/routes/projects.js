const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// Get all projects (for current user)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    }).populate('owner', 'name email').populate('members', 'name email');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single project with tasks
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check access
    if (project.owner._id.toString() !== req.userId && 
        !project.members.some(m => m._id.toString() === req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json({ project, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project (Admin only)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    const project = new Project({
      name,
      description,
      owner: req.userId,
      members: members || []
    });
    
    await project.save();
    await project.populate('owner', 'name email');
    
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update project (Admin only)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const { name, description, status, members } = req.body;
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (members) project.members = members;
    
    await project.save();
    await project.populate('owner', 'name email').populate('members', 'name email');
    
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete project (Admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add member to project (Admin only)
router.post('/:id/members', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    
    await project.populate('members', 'name email');
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;