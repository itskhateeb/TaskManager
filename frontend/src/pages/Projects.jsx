import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, FolderGit2, Users, Calendar, Trash2, Edit } from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: []
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, formData);
      } else {
        await API.post('/projects', formData);
      }
      fetchProjects();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await API.delete(`/projects/${id}`);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', members: [] });
    setEditingProject(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage all your projects and teams</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project._id} className="card hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FolderGit2 className="text-blue-600" size={24} />
                <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
              </div>
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setFormData({
                        name: project.name,
                        description: project.description,
                        members: project.members.map(m => m._id)
                      });
                      setShowModal(true);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{project.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Team Size</span>
                <span className="font-medium">{project.members?.length || 0} members</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Owner</span>
                <span className="font-medium">{project.owner?.name}</span>
              </div>
            </div>
            
            <button className="w-full btn-secondary text-sm">View Details</button>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
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