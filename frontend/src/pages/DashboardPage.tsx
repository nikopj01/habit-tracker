import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { activityService } from '../services/activityService';
import type { ActivityAnalytics, DashboardResponse } from '../types/dashboard';
import type { ActivityListResponse } from '../types/activity';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [activities, setActivities] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      console.log('Fetching dashboard...');
      const [dashboardData, activitiesData] = await Promise.all([
        dashboardService.getDashboard(),
        activityService.getActivities(true),
      ]);
      console.log('Dashboard data received:', dashboardData);
      console.log('Activities data received:', activitiesData);
      setDashboard(dashboardData);
      setActivities(activitiesData);
      
      // Only set initial selected date on first load, not on refresh
      if (dashboardData && !dashboard) {
        const newDate = new Date(dashboardData.year, dashboardData.month - 1, 1);
        setSelectedDate(newDate);
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Show error to user
      let errorMessage = 'Failed to load dashboard';
      if (error.response?.status === 400) {
        errorMessage = 'Bad Request - Invalid parameters sent to server';
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized - Please sign in again';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error - Please try again later';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivity = async (activityId: string, date: Date, currentStatus: boolean) => {
    // Format date as YYYY-MM-DD to preserve the local date without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('handleToggleActivity: Selected date:', date, 'Formatted:', dateString);
    
    const newStatus = !currentStatus;
    const updateKey = `${activityId}-${dateString}`;

    // Optimistic update
    setOptimisticUpdates((prev) => new Map(prev.set(updateKey, newStatus)));

    try {
      await dashboardService.updateActivityStatus(activityId, {
        date: dateString,
        isCompleted: newStatus,
      });
      
      // Refresh dashboard to get updated analytics
      await fetchDashboard();
      // Clear optimistic update after successful refresh
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(updateKey);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to update activity status:', error);
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(updateKey);
        return newMap;
      });
    }
  };

  const getDaysArray = () => {
    if (!dashboard) return [];
    // Handle both camelCase and PascalCase property names
    const daysInMonth = dashboard.daysInMonth || (dashboard as any).DaysInMonth || 0;
    if (!daysInMonth || daysInMonth <= 0) {
      console.error('Invalid daysInMonth:', daysInMonth, dashboard);
      return [];
    }
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day: number) => {
    if (!dashboard) return false;
    const today = new Date();
    return today.getDate() === day && today.getMonth() + 1 === dashboard.month && today.getFullYear() === dashboard.year;
  };

  const isSelectedDate = (day: number) => {
    if (!dashboard) return false;
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() + 1 === dashboard.month && 
           selectedDate.getFullYear() === dashboard.year;
  };

  const handleDateSelect = (day: number) => {
    if (!dashboard) return;
    const newDate = new Date(dashboard.year, dashboard.month - 1, day);
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchDashboard();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/signin')}
            className="ml-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, {user?.nickname || 'User'}!
              </h1>
              <p className="text-sm text-gray-600">
                {dashboard?.month}/{dashboard?.year}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Settings
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {new Date(dashboard?.year || 2026, (dashboard?.month || 1) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="text-sm text-gray-600">
              Selected: <span className="font-semibold">{selectedDate.toLocaleDateString()}</span>
              {isToday(selectedDate.getDate()) && <span className="ml-2 text-blue-600">(Today)</span>}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {getDaysArray().map((day) => (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                className={`
                  text-center py-2 rounded-lg text-sm transition-colors
                  ${isSelectedDate(day) ? 'bg-blue-600 text-white font-bold' : ''}
                  ${isToday(day) && !isSelectedDate(day) ? 'bg-blue-100 text-blue-800 font-semibold' : ''}
                  ${!isToday(day) && !isSelectedDate(day) ? 'text-gray-700 hover:bg-gray-100' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Activities ({activities?.activeCount || 0}/10)
          </h2>
          
          {dashboard?.activities.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">No activities yet. Create one in settings!</p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Settings
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboard?.activities.map((activity) => {
                const dayIndex = selectedDate.getDate() - 1;
                const isCompletedOnSelectedDate = activity.completionHistory[dayIndex] || false;
                const updateKey = `${activity.activityId}-${selectedDate.toISOString().split('T')[0]}`;
                const optimisticValue = optimisticUpdates.get(updateKey);
                // Use optimistic value if present, otherwise use actual value
                const displayStatus = optimisticValue !== undefined ? optimisticValue : isCompletedOnSelectedDate;
                
                return (
                  <ActivityCard
                    key={activity.activityId}
                    activity={activity}
                    selectedDate={selectedDate}
                    isCompleted={displayStatus}
                    onToggle={() => handleToggleActivity(activity.activityId, selectedDate, isCompletedOnSelectedDate)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

interface ActivityCardProps {
  activity: ActivityAnalytics;
  selectedDate: Date;
  isCompleted: boolean;
  onToggle: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, selectedDate, isCompleted, onToggle }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{activity.activityName}</h3>
          {activity.activityDescription && (
            <p className="text-sm text-gray-600 mt-1">{activity.activityDescription}</p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-gray-500 mb-1">
            {selectedDate.toLocaleDateString()}
          </p>
          <button
            onClick={onToggle}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${isCompleted 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
            `}
          >
            {isCompleted ? '✓ Done' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Heat Map */}
      <div className="mb-4">
        <div className="flex gap-1 flex-wrap">
          {activity.completionHistory.map((completed, index) => (
            <div
              key={index}
              className={`
                w-4 h-4 rounded-sm
                ${completed ? 'bg-green-500' : 'bg-gray-200'}
              `}
              title={`Day ${index + 1}: ${completed ? 'Completed' : 'Not completed'}`}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Total Done:</span>
          <span className="ml-2 font-semibold">{activity.totalCompleted}</span>
        </div>
        <div>
          <span className="text-gray-500">Current Streak:</span>
          <span className="ml-2 font-semibold">{activity.currentStreak} days</span>
        </div>
        <div>
          <span className="text-gray-500">Longest Streak:</span>
          <span className="ml-2 font-semibold">{activity.longestStreak} days</span>
        </div>
        <div>
          <span className="text-gray-500">Effort Score:</span>
          <span className="ml-2 font-semibold">{activity.effortScore}%</span>
        </div>
        <div className="col-span-2">
          <div className="flex items-center">
            <span className="text-gray-500">Monthly Progress:</span>
            <span className="ml-2 font-semibold">{activity.monthlyProgress}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(activity.monthlyProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;