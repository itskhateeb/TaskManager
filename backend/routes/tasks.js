const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Get all tasks for dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    // First, get all projects where user is member or owner
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    });
    
    const projectIds = projects.map(p => p._id);
    
    // Get tasks from those projects
    let tasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    // ALSO get tasks directly assigned to the user (even if not in project members)
    const directlyAssignedTasks = await Task.find({ assignedTo: req.userId })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    // Merge both sets of tasks (remove duplicates by _id)
    const allTasksMap = new Map();
    
    tasks.forEach(task => {
      allTasksMap.set(task._id.toString(), task);
    });
    
    directlyAssignedTasks.forEach(task => {
      if (!allTasksMap.has(task._id.toString())) {
        allTasksMap.set(task._id.toString(), task);
      }
    });
    
    tasks = Array.from(allTasksMap.values());
    
    // Calculate stats for all tasks user can see
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length
    };
    
    // IMPORTANT: Show tasks assigned to current user
    const myTasks = tasks.filter(task => {
      if (!task.assignedTo) return false;
      const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
      const isAssigned = assignedToId.toString() === req.userId;
      if (isAssigned) {
        console.log(`Task "${task.title}" is assigned to user ${req.userId}`);
      }
      return isAssigned;
    });
    
    console.log(`User ${req.userId} - Total visible tasks: ${tasks.length}, Assigned to user: ${myTasks.length}`);
    
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

// Update task status - Only assigned user or admin can update
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get the assigned user ID
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    
    // Check if user is admin OR the task is assigned to them
    const isAdmin = req.user.role === 'admin';
    const isAssignedToUser = assignedToId.toString() === req.userId;
    
    console.log(`Task update - User: ${req.user.email}, IsAdmin: ${isAdmin}, IsAssigned: ${isAssignedToUser}`);
    
    // Only admin or the assigned person can update task status
    if (!isAdmin && !isAssignedToUser) {
      return res.status(403).json({ error: 'Access denied. You can only update tasks assigned to you.' });
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