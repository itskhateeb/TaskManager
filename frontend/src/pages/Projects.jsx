import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderGit2, Users, Calendar, Trash2, Edit, X } from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const { data } = await API.get(`/projects/${projectId}`);
      setSelectedProject(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('Failed to fetch project details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, formData);
        alert('Project updated successfully!');
      } else {
        await API.post('/projects', formData);
        alert('Project created successfully!');
      }
      fetchProjects();
      setShowModal(false);
      setFormData({ name: '', description: '' });
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
      alert(error.response?.data?.error || 'Failed to save project');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!taskData.assignedTo) {
      alert('Please assign this task to a team member');
      return;
    }
    
    if (!taskData.dueDate) {
      alert('Please select a due date');
      return;
    }
    
    try {
      await API.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        projectId: selectedProject.project._id,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority,
        dueDate: taskData.dueDate
      });
      
      alert('Task created successfully!');
      setShowTaskModal(false);
      // Refresh the project details to show the new task
      await fetchProjectDetails(selectedProject.project._id);
      
      setTaskData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: ''
      });
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project? This will also delete all tasks in this project.')) {
      try {
        await API.delete(`/projects/${id}`);
        alert('Project deleted successfully!');
        fetchProjects();
        if (selectedProject?.project._id === id) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await API.patch(`/tasks/${taskId}/status`, { status: newStatus });
      console.log('Update response:', response.data);
      
      // Refresh the project details to show updated status
      if (selectedProject) {
        const { data } = await API.get(`/projects/${selectedProject.project._id}`);
        setSelectedProject(data);
      }
      
      alert(`Task status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTaskStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all your projects and teams</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => fetchProjectDetails(project._id)}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedProject?.project._id === project._id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <FolderGit2 className="text-blue-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setFormData({
                          name: project.name,
                          description: project.description
                        });
                        setShowModal(true);
                      }}
                      className="text-gray-500 hover:text-blue-600 p-1"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="text-gray-500 hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className={`px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className="flex items-center space-x-1 text-gray-500">
                  <Users size={12} />
                  <span>{project.members?.length || 0} members</span>
                </span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <FolderGit2 size={48} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No projects yet.</p>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-blue-600 hover:text-blue-700"
                >
                  Create your first project
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.project.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedProject.project.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500 flex items-center space-x-1">
                      <Users size={14} />
                      <span>Owner: {selectedProject.project.owner?.name}</span>
                    </span>
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(selectedProject.project.status)}`}>
                      {selectedProject.project.status}
                    </span>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 text-sm"
                  >
                    <Plus size={16} />
                    <span>Add Task</span>
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Tasks ({selectedProject.tasks?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedProject.tasks?.map((task) => (
                    <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getTaskStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Assigned to: {task.assignedTo?.name}</span>
                            <span>Created by: {task.assignedBy?.name}</span>
                            <span className="flex items-center space-x-1">
                              <Calendar size={12} />
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 ml-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {selectedProject.tasks?.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No tasks in this project yet.</p>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setShowTaskModal(true)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Create the first task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FolderGit2 size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a project from the list</p>
              <p className="text-sm text-gray-400 mt-2">Click on any project to view details and tasks</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
                  setFormData({ name: '', description: '' });
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="3"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  value={taskData.assignedTo}
                  onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select a team member</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;