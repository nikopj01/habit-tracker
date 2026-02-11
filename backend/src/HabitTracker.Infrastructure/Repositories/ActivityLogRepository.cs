using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;
using HabitTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitTracker.Infrastructure.Repositories;

public class ActivityLogRepository : IActivityLogRepository
{
    private readonly ApplicationDbContext _context;

    public ActivityLogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ActivityLog?> GetByActivityAndDateAsync(Guid activityId, DateTime date)
    {
        // Ensure date is UTC and use date comparison
        var utcDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        
        // Fetch all logs for this activity and filter in memory to avoid EF date comparison issues
        var logs = await _context.ActivityLogs
            .AsNoTracking()
            .Where(al => al.ActivityId == activityId)
            .ToListAsync();
            
        return logs.FirstOrDefault(al => al.Date.Date == utcDate.Date);
    }

    public async Task<IEnumerable<ActivityLog>> GetByActivityIdAsync(Guid activityId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        // Fetch all logs for this activity
        var query = _context.ActivityLogs
            .AsNoTracking()
            .Where(al => al.ActivityId == activityId)
            .AsEnumerable(); // Switch to in-memory filtering

        if (fromDate.HasValue)
        {
            var utcFromDate = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(al => al.Date.Date >= utcFromDate.Date);
        }

        if (toDate.HasValue)
        {
            var utcToDate = DateTime.SpecifyKind(toDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(al => al.Date.Date <= utcToDate.Date);
        }

        return query
            .OrderBy(al => al.Date)
            .ToList();
    }

    public async Task<IEnumerable<ActivityLog>> GetByUserIdAndDateRangeAsync(Guid userId, DateTime fromDate, DateTime toDate)
    {
        var utcFromDate = DateTime.SpecifyKind(fromDate, DateTimeKind.Utc);
        var utcToDate = DateTime.SpecifyKind(toDate, DateTimeKind.Utc);
        
        return await _context.ActivityLogs
            .AsNoTracking()
            .Where(al => al.UserId == userId && al.Date >= utcFromDate && al.Date <= utcToDate)
            .OrderBy(al => al.Date)
            .ToListAsync();
    }

    public async Task<ActivityLog> CreateAsync(ActivityLog activityLog)
    {
        activityLog.Date = DateTime.SpecifyKind(activityLog.Date.Date, DateTimeKind.Utc);
        activityLog.CreatedAt = DateTime.UtcNow;
        activityLog.UpdatedAt = DateTime.UtcNow;
        
        Console.WriteLine($"Creating ActivityLog: ActivityId={activityLog.ActivityId}, Date={activityLog.Date}, IsCompleted={activityLog.IsCompleted}");
        
        _context.ActivityLogs.Add(activityLog);
        await _context.SaveChangesAsync();
        
        return activityLog;
    }

    public async Task<ActivityLog> UpdateAsync(ActivityLog activityLog)
    {
        activityLog.UpdatedAt = DateTime.UtcNow;
        
        Console.WriteLine($"Updating ActivityLog: Id={activityLog.Id}, ActivityId={activityLog.ActivityId}, Date={activityLog.Date}, IsCompleted={activityLog.IsCompleted}");
        
        _context.ActivityLogs.Update(activityLog);
        await _context.SaveChangesAsync();
        
        return activityLog;
    }

    public async Task<bool> ExistsAsync(Guid activityId, DateTime date)
    {
        var utcDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        return await _context.ActivityLogs
            .AnyAsync(al => al.ActivityId == activityId && al.Date == utcDate);
    }
}