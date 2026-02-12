import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { activityService } from '../services/activityService';
import type { ActivityAnalytics, DashboardResponse } from '../types/dashboard';
import type { ActivityListResponse } from '../types/activity';
import { useAuth } from '../context/AuthContext';
import { triggerCompletionAnimation } from '../utils/animations';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [activities, setActivities] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Track button refs for animation positioning
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard for:', currentDate.getFullYear(), currentDate.getMonth() + 1);
      const [dashboardData, activitiesData] = await Promise.all([
        dashboardService.getDashboard(currentDate.getFullYear(), currentDate.getMonth() + 1),
        activityService.getActivities(true),
      ]);
      console.log('Dashboard data received:', dashboardData);
      console.log('Activities data received:', activitiesData);
      setDashboard(dashboardData);
      setActivities(activitiesData);
      
      // Update selected date to first day of current month view if not same month
      if (dashboardData) {
        const dashboardMonth = dashboardData.month - 1;
        const dashboardYear = dashboardData.year;
        if (selectedDate.getMonth() !== dashboardMonth || selectedDate.getFullYear() !== dashboardYear) {
          setSelectedDate(new Date(dashboardYear, dashboardMonth, 1));
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      setError(error.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleToggleActivity = async (
    activityId: string, 
    date: Date, 
    currentStatus: boolean,
    buttonElement?: HTMLButtonElement
  ) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    const newStatus = !currentStatus;
    const updateKey = `${activityId}-${dateString}`;

    setOptimisticUpdates((prev) => new Map(prev.set(updateKey, newStatus)));

    try {
      await dashboardService.updateActivityStatus(activityId, {
        date: dateString,
        isCompleted: newStatus,
      });
      
      // Trigger animation if marking as done (newStatus = true)
      if (newStatus && buttonElement) {
        // Calculate completion count for this date
        const completionCount = getCompletionCountForDate(date) + 1;
        triggerCompletionAnimation(completionCount, buttonElement);
      }
      
      await fetchDashboard();
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(updateKey);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to update activity status:', error);
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(updateKey);
        return newMap;
      });
    }
  };

  const getCompletionCountForDate = (date: Date): number => {
    if (!dashboard || !activities) return 0;
    
    const dayIndex = date.getDate() - 1;
    let count = 0;
    
    dashboard.activities.forEach(activity => {
      if (activity.completionHistory[dayIndex]) {
        count++;
      }
    });
    
    return count;
  };

  const getTotalActivitiesForDate = (): number => {
    return activities?.activities?.length || dashboard?.activities?.length || 0;
  };

  const getDailyProgress = (): { completed: number; total: number; percentage: number } => {
    const completed = getCompletionCountForDate(selectedDate);
    const total = getTotalActivitiesForDate();
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const getDaysArray = () => {
    if (!dashboard) return [];
    const daysInMonth = dashboard.daysInMonth || (dashboard as any).DaysInMonth || 0;
    if (!daysInMonth || daysInMonth <= 0) return [];
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day: number) => {
    if (!dashboard) return false;
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() + 1 === dashboard.month && 
           today.getFullYear() === dashboard.year;
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

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const dailyProgress = getDailyProgress();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <div className="text-lg text-[var(--text-secondary)]">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              fetchDashboard();
            }}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Retry
          </button>
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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-neon-cyan">
                <span className="text-xl font-bold text-white">
                  {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  Hello, {user?.nickname || 'User'}!
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {dashboard?.month}/{dashboard?.year}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] 
                  bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl
                  hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                  bg-gradient-to-r from-red-500 to-pink-600 rounded-xl
                  hover:shadow-lg hover:shadow-red-500/25 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar */}
        <div className="glass-card rounded-2xl p-6 mb-6 card-hover">
          {/* Calendar Header with Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {new Date(dashboard?.year || 2026, (dashboard?.month || 1) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Selected: {selectedDate.toLocaleDateString()}
                  {isToday(selectedDate.getDate()) && dashboard?.month === new Date().getMonth() + 1 && dashboard?.year === new Date().getFullYear() && (
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">Today</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] 
                  hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
                title="Previous Month"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] 
                  bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl
                  hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] 
                  hover:border-cyan-500/50 hover:text-cyan-500 transition-all"
                title="Next Month"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
            {getDaysArray().map((day) => (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                className={`
                  text-center py-3 rounded-xl text-sm font-medium transition-all duration-300
                  ${isSelectedDate(day) 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transform scale-105' 
                    : ''}
                  ${isToday(day) && !isSelectedDate(day) 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                    : ''}
                  ${!isToday(day) && !isSelectedDate(day) 
                    ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]' 
                    : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Daily Progress Bar */}
          <div className="border-t border-[var(--border-color)] pt-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Daily Progress ({selectedDate.toLocaleDateString()})
                </span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {dailyProgress.completed} of {dailyProgress.total} completed ({dailyProgress.percentage}%)
              </span>
            </div>
            <div className="h-4 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 progress-bar ${
                  dailyProgress.percentage >= 100 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                    : dailyProgress.percentage >= 50 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                      : 'bg-gradient-to-r from-pink-500 to-rose-600'
                }`}
                style={{ width: `${dailyProgress.percentage}%` }}
              />
            </div>
            {dailyProgress.percentage >= 100 && (
              <p className="mt-2 text-sm text-emerald-400 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All activities completed for this day!
              </p>
            )}
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Your Activities
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {activities?.activeCount || 0} of 10 active activities
                </p>
              </div>
            </div>
          </div>
          
          {dashboard?.activities.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No activities yet</h3>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Create your first habit to start tracking your progress and building streaks
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl
                  shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                  transform hover:scale-105 transition-all"
              >
                Create Activity
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dashboard?.activities.map((activity, index) => {
                const dayIndex = selectedDate.getDate() - 1;
                const isCompletedOnSelectedDate = activity.completionHistory[dayIndex] || false;
                const updateKey = `${activity.activityId}-${selectedDate.toISOString().split('T')[0]}`;
                const optimisticValue = optimisticUpdates.get(updateKey);
                const displayStatus = optimisticValue !== undefined ? optimisticValue : isCompletedOnSelectedDate;
                
                return (
                  <ActivityCard
                    key={activity.activityId}
                    activity={activity}
                    selectedDate={selectedDate}
                    isCompleted={displayStatus}
                    onToggle={(buttonRef) => handleToggleActivity(activity.activityId, selectedDate, isCompletedOnSelectedDate, buttonRef)}
                    index={index}
                    buttonRefs={buttonRefs}
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
  onToggle: (buttonRef?: HTMLButtonElement) => void;
  index: number;
  buttonRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  selectedDate, 
  isCompleted, 
  onToggle, 
  index,
  buttonRefs 
}) => {
  const buttonId = `${activity.activityId}-${selectedDate.toISOString().split('T')[0]}`;
  
  return (
    <div 
      className="glass-card rounded-2xl p-6 card-hover"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{activity.activityName}</h3>
          {activity.activityDescription && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{activity.activityDescription}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-[var(--text-tertiary)]">
            {selectedDate.toLocaleDateString()}
          </p>
          <button
            ref={(el) => {
              if (el) buttonRefs.current.set(buttonId, el);
            }}
            onClick={() => onToggle(buttonRefs.current.get(buttonId))}
            className={`
              px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105
              ${isCompleted 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-cyan-500/50'}
            `}
          >
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </span>
            ) : (
              'Mark Done'
            )}
          </button>
        </div>
      </div>

      {/* Heat Map */}
      <div className="mb-6">
        <div className="flex gap-1 flex-wrap">
          {activity.completionHistory.map((completed, idx) => (
            <div
              key={idx}
              className={`
                w-3 h-3 rounded-sm transition-all duration-300
                ${completed ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-[var(--bg-tertiary)]'}
              `}
              title={`Day ${idx + 1}: ${completed ? 'Completed' : 'Not completed'}`}
            />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Total Done</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">{activity.totalCompleted}</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Current Streak</p>
          <p className="text-xl font-bold text-cyan-500">{activity.currentStreak}d</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Best Streak</p>
          <p className="text-xl font-bold text-purple-500">{activity.longestStreak}d</p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Effort</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">{activity.effortScore}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Monthly Progress</span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{activity.monthlyProgress}%</span>
        </div>
        <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 progress-bar"
            style={{ width: `${Math.min(activity.monthlyProgress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
