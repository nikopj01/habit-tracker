using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Repositories;

public class ActivityRepository : IActivityRepository
{
    private readonly ApplicationDbContext _context;

    public ActivityRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Activity?> GetByIdAsync(Guid id)
    {
        return await _context.Activities
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<Activity>> GetByUserIdAsync(Guid userId, bool? isActive = null)
    {
        var query = _context.Activities
            .AsNoTracking()
            .Where(a => a.UserId == userId);

        if (isActive.HasValue)
        {
            query = query.Where(a => a.IsActive == isActive.Value);
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetActiveCountByUserIdAsync(Guid userId)
    {
        return await _context.Activities
            .CountAsync(a => a.UserId == userId && a.IsActive);
    }

    public async Task<Activity> CreateAsync(Activity activity)
    {
        activity.CreatedAt = DateTime.UtcNow;
        activity.UpdatedAt = DateTime.UtcNow;
        
        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();
        
        return activity;
    }

    public async Task<Activity> UpdateAsync(Activity activity)
    {
        activity.UpdatedAt = DateTime.UtcNow;
        
        _context.Activities.Update(activity);
        await _context.SaveChangesAsync();
        
        return activity;
    }

    public async Task<bool> ExistsByNameAsync(Guid userId, string name)
    {
        return await _context.Activities
            .AnyAsync(a => a.UserId == userId && 
                          a.Name.ToLower() == name.ToLower() && 
                          a.IsActive);
    }
}