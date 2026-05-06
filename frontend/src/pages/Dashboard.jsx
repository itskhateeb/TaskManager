import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await API.get('/tasks/dashboard');
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const myTasks = dashboardData?.myTasks || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your tasks today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdue || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* My Tasks Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
          </div>
          <span className="text-sm text-gray-500">{myTasks.length} tasks assigned</span>
        </div>

        {myTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTasks.map((task) => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Project: {task.project?.name}</span>
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <select
                    value={task.status}
                    onChange={async (e) => {
                      try {
                        await API.patch(`/tasks/${task._id}/status`, { status: e.target.value });
                        fetchDashboardData();
                      } catch (error) {
                        console.error('Error updating task:', error);
                      }
                    }}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;