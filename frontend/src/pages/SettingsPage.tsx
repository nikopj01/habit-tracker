import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../services/activityService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import type { Activity, ActivityListResponse } from '../types/activity';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [activeActivities, setActiveActivities] = useState<Activity[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<Activity[]>([]);
  const [activitiesData, setActivitiesData] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const [activeData, allData] = await Promise.all([
        activityService.getActivities(true),
        activityService.getActivities(),
      ]);
      
      setActivitiesData(activeData);
      setActiveActivities(activeData.activities);
      setArchivedActivities(allData.activities.filter(a => !a.isActive));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await activityService.archiveActivity(id);
      await fetchActivities();
    } catch (error) {
      console.error('Failed to archive activity:', error);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await activityService.restoreActivity(id);
      await fetchActivities();
    } catch (error) {
      console.error('Failed to restore activity:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setIsSavingProfile(true);

    try {
      const updatedUser = await authService.setNickname({ nickname: nickname.trim() });
      // Update auth context with new user data
      const token = localStorage.getItem('accessToken') || '';
      login(token, updatedUser);
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="p-6">
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile}>
                {profileError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {profileError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div className="mb-4">
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname
                  </label>
                  <input
                    id="nickname"
                    type="text"
                    required
                    maxLength={50}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your nickname"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {nickname.length}/50 characters
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setNickname(user?.nickname || '');
                      setProfileError('');
                    }}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Nickname</p>
                  <p className="text-gray-900 font-medium">{user?.nickname || 'Not set'}</p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Activities Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Active Activities</h2>
                <p className="text-sm text-gray-600">
                  {activitiesData?.activeCount || 0} of 10 active activities
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={(activitiesData?.remainingSlots || 0) <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Activity
              </button>
            </div>
          </div>

          <div className="p-6">
            {showCreateForm && (
              <ActivityForm
                onCancel={() => setShowCreateForm(false)}
                onSuccess={() => {
                  setShowCreateForm(false);
                  fetchActivities();
                }}
              />
            )}

            {editingActivity && (
              <ActivityForm
                activity={editingActivity}
                onCancel={() => setEditingActivity(null)}
                onSuccess={() => {
                  setEditingActivity(null);
                  fetchActivities();
                }}
              />
            )}

            <div className="space-y-4">
              {activeActivities.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No active activities. Create one above!</p>
              ) : (
                activeActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isArchived={false}
                    onEdit={() => setEditingActivity(activity)}
                    onArchive={() => handleArchive(activity.id)}
                    onRestore={() => {}}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Archived Activities Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Archived Activities</h2>
          </div>
          <div className="p-6">
            {archivedActivities.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No archived activities</p>
            ) : (
              <div className="space-y-4">
                {archivedActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isArchived={true}
                    onEdit={() => {}}
                    onArchive={() => {}}
                    onRestore={() => handleRestore(activity.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

interface ActivityItemProps {
  activity: Activity;
  isArchived: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
}) => {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
      <div>
        <h3 className="font-medium text-gray-900">{activity.name}</h3>
        {activity.description && (
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        )}
      </div>
      <div className="flex space-x-2">
        {!isArchived && (
          <>
            <button
              onClick={onEdit}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Edit
            </button>
            <button
              onClick={onArchive}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Archive
            </button>
          </>
        )}
        {isArchived && (
          <button
            onClick={onRestore}
            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
          >
            Restore
          </button>
        )}
      </div>
    </div>
  );
};

interface ActivityFormProps {
  activity?: Activity;
  onCancel: () => void;
  onSuccess: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ activity, onCancel, onSuccess }) => {
  const [name, setName] = useState(activity?.name || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activity) {
        await activityService.updateActivity(activity.id, { name, description });
      } else {
        await activityService.createActivity({ name, description });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save activity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {activity ? 'Edit Activity' : 'Create New Activity'}
      </h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Activity name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Activity description (optional)"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : activity ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default SettingsPage;