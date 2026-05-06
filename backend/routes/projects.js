const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
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
    
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json({ project, tasks });
  } catch (error) {
    console.error('Error:', error);
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
    console.error('Error creating project:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update project (Admin only)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, description, status, members } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
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
    
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;