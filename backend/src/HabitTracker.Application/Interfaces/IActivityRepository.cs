using HabitTracker.Application.Entities;

namespace HabitTracker.Application.Interfaces;

public interface IActivityRepository
{
    Task<Activity?> GetByIdAsync(Guid id);
    Task<IEnumerable<Activity>> GetByUserIdAsync(Guid userId, bool? isActive = null);
    Task<int> GetActiveCountByUserIdAsync(Guid userId);
    Task<Activity> CreateAsync(Activity activity);
    Task<Activity> UpdateAsync(Activity activity);
    Task<bool> ExistsByNameAsync(Guid userId, string name);
}