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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-[var(--text-secondary)]">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] cyber-grid">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] 
                bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl
                hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="glass-card rounded-2xl mb-8 overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Profile</h2>
          </div>
          <div className="p-6">
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="max-w-xl">
                {profileError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{profileError}</span>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Email
                  </label>
                  <p className="text-[var(--text-primary)] font-medium">{user?.email}</p>
                </div>
                <div className="mb-6">
                  <label htmlFor="nickname" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Nickname
                  </label>
                  <input
                    id="nickname"
                    type="text"
                    required
                    maxLength={50}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="block w-full px-4 py-3 border border-[var(--border-color)] rounded-xl 
                      bg-[var(--bg-tertiary)] text-[var(--text-primary)]
                      placeholder-[var(--text-tertiary)]
                      focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
                      transition-all duration-300"
                    placeholder="Enter your nickname"
                  />
                  <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                    {nickname.length}/50 characters
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl
                      shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                      transform hover:scale-[1.02] transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSavingProfile ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setNickname(user?.nickname || '');
                      setProfileError('');
                    }}
                    className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium 
                      border border-[var(--border-color)] rounded-xl
                      hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="max-w-xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-neon-cyan">
                    <span className="text-3xl font-bold text-white">
                      {user?.nickname?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Email</p>
                      <p className="text-[var(--text-primary)] font-medium">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Nickname</p>
                      <p className="text-[var(--text-primary)] font-medium text-lg">{user?.nickname || 'Not set'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl
                    shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                    transform hover:scale-[1.02] transition-all"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Activities Section */}
        <div className="glass-card rounded-2xl mb-8 overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-600/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Active Activities</h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {activitiesData?.activeCount || 0} of 10 active activities
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={(activitiesData?.remainingSlots || 0) <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl
                  shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                  transform hover:scale-[1.02] transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-[var(--text-secondary)] mb-2">No active activities</p>
                  <p className="text-sm text-[var(--text-tertiary)]">Create your first habit to start tracking!</p>
                </div>
              ) : (
                activeActivities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isArchived={false}
                    onEdit={() => setEditingActivity(activity)}
                    onArchive={() => handleArchive(activity.id)}
                    onRestore={() => {}}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Archived Activities Section */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500/20 to-slate-600/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Archived Activities</h2>
          </div>
          <div className="p-6">
            {archivedActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)]">No archived activities</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Archived activities will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedActivities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isArchived={true}
                    onEdit={() => {}}
                    onArchive={() => {}}
                    onRestore={() => handleRestore(activity.id)}
                    index={index}
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
  index: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isArchived,
  onEdit,
  onArchive,
  onRestore,
  index,
}) => {
  return (
    <div 
      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 glass rounded-xl gap-4
        hover:border-cyan-500/30 transition-all duration-300"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex-1">
        <h3 className="font-semibold text-[var(--text-primary)]">{activity.name}</h3>
        {activity.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{activity.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isArchived && (
          <>
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-cyan-500 
                bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={onArchive}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-400 
                bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archive
            </button>
          </>
        )}
        {isArchived && (
          <button
            onClick={onRestore}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-emerald-400 
              bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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
    <form onSubmit={handleSubmit} className="mb-6 p-6 glass rounded-2xl border border-cyan-500/30">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {activity ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            )}
          </svg>
        </div>
        {activity ? 'Edit Activity' : 'Create New Activity'}
      </h3>
      
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Activity Name</label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full px-4 py-3 border border-[var(--border-color)] rounded-xl 
              bg-[var(--bg-tertiary)] text-[var(--text-primary)]
              placeholder-[var(--text-tertiary)]
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
              transition-all duration-300"
            placeholder="e.g., Morning Exercise, Read 30 minutes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Description <span className="text-[var(--text-tertiary)]">(optional)</span>
          </label>
          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full px-4 py-3 border border-[var(--border-color)] rounded-xl 
              bg-[var(--bg-tertiary)] text-[var(--text-primary)]
              placeholder-[var(--text-tertiary)]
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50
              transition-all duration-300 resize-none"
            placeholder="Add details about this activity..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl
              shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
              transform hover:scale-[1.02] transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              activity ? 'Update Activity' : 'Create Activity'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium 
              border border-[var(--border-color)] rounded-xl
              hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default SettingsPage;
