using HabitTracker.Application.Entities;

namespace HabitTracker.Application.Interfaces;

public interface IUserMonthlyActivityRepository
{
    Task<List<UserMonthlyActivity>> GetByUserAndMonthAsync(Guid userId, int year, int month);
    Task CreateMonthSelectionIfMissingAsync(Guid userId, int year, int month, IEnumerable<Guid> seedActivityIds);
    Task ReplaceMonthSelectionAsync(Guid userId, int year, int month, IEnumerable<Guid> selectedActivityIds);
}
