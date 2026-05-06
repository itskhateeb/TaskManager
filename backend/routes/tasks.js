const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Get all tasks for dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    });
    
    const projectIds = projects.map(p => p._id);
    
    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length
    };
    
    const myTasks = tasks.filter(t => t.assignedTo && t.assignedTo._id && t.assignedTo._id.toString() === req.userId);
    
    res.json({ tasks, myTasks, stats });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create task (Admin only)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const task = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      assignedBy: req.userId,
      priority,
      dueDate
    });
    
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('project', 'name');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.status = status;
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('project', 'name');
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update full task (Admin only)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (status) task.status = status;
    
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('project', 'name');
    
    res.json(populatedTask);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task (Admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;