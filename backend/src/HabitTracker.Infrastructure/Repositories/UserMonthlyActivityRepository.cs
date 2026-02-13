using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Repositories;

public class UserMonthlyActivityRepository : IUserMonthlyActivityRepository
{
    private readonly ApplicationDbContext _context;

    public UserMonthlyActivityRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserMonthlyActivity>> GetByUserAndMonthAsync(Guid userId, int year, int month)
    {
        return await _context.UserMonthlyActivities
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.Year == year && x.Month == month)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task CreateMonthSelectionIfMissingAsync(Guid userId, int year, int month, IEnumerable<Guid> seedActivityIds)
    {
        var hasExisting = await _context.UserMonthlyActivities
            .AnyAsync(x => x.UserId == userId && x.Year == year && x.Month == month);

        if (hasExisting)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var rows = seedActivityIds.Distinct().Select(activityId => new UserMonthlyActivity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ActivityId = activityId,
            Year = year,
            Month = month,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        _context.UserMonthlyActivities.AddRange(rows);
        await _context.SaveChangesAsync();
    }

    public async Task ReplaceMonthSelectionAsync(Guid userId, int year, int month, IEnumerable<Guid> selectedActivityIds)
    {
        var currentRows = await _context.UserMonthlyActivities
            .Where(x => x.UserId == userId && x.Year == year && x.Month == month)
            .ToListAsync();

        _context.UserMonthlyActivities.RemoveRange(currentRows);

        var now = DateTime.UtcNow;
        var rows = selectedActivityIds.Distinct().Select(activityId => new UserMonthlyActivity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ActivityId = activityId,
            Year = year,
            Month = month,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        _context.UserMonthlyActivities.AddRange(rows);
        await _context.SaveChangesAsync();
    }
}
