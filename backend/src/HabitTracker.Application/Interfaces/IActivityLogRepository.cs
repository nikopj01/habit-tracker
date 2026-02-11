using HabitTracker.Application.Entities;

namespace HabitTracker.Application.Interfaces;

public interface IActivityLogRepository
{
    Task<ActivityLog?> GetByActivityAndDateAsync(Guid activityId, DateTime date);
    Task<IEnumerable<ActivityLog>> GetByActivityIdAsync(Guid activityId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<IEnumerable<ActivityLog>> GetByUserIdAndDateRangeAsync(Guid userId, DateTime fromDate, DateTime toDate);
    Task<ActivityLog> CreateAsync(ActivityLog activityLog);
    Task<ActivityLog> UpdateAsync(ActivityLog activityLog);
    Task<bool> ExistsAsync(Guid activityId, DateTime date);
}