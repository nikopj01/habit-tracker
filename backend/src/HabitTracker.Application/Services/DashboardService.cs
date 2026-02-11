using HabitTracker.Application.DTOs;
using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;

namespace HabitTracker.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IActivityLogRepository _activityLogRepository;

    public DashboardService(
        IActivityRepository activityRepository,
        IActivityLogRepository activityLogRepository)
    {
        _activityRepository = activityRepository;
        _activityLogRepository = activityLogRepository;
    }

    public async Task<DashboardResponseDto> GetDashboardAsync(Guid userId, int year, int month)
    {
        // Get all active activities for the user
        var activities = await _activityRepository.GetByUserIdAsync(userId, isActive: true);
        
        // Calculate date range
        var startOfMonth = DateTime.SpecifyKind(new DateTime(year, month, 1), DateTimeKind.Utc);
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var endOfMonth = DateTime.SpecifyKind(startOfMonth.AddDays(daysInMonth - 1), DateTimeKind.Utc);
        var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var currentDay = today.Month == month && today.Year == year ? today.Day : daysInMonth;
        
        // Calculate analytics for each activity
        var activityAnalytics = new List<ActivityAnalyticsDto>();
        foreach (var activity in activities)
        {
            var analytics = await CalculateActivityAnalyticsAsync(
                activity, userId, year, month, daysInMonth, currentDay);
            activityAnalytics.Add(analytics);
        }

        return new DashboardResponseDto(
            Year: year,
            Month: month,
            DaysInMonth: daysInMonth,
            CurrentDay: currentDay,
            Activities: activityAnalytics
        );
    }

    public async Task<ActivityLogResponseDto> UpdateActivityStatusAsync(
        Guid userId, 
        Guid activityId, 
        UpdateActivityStatusRequestDto request)
    {
        // Verify activity exists and belongs to user
        var activity = await _activityRepository.GetByIdAsync(activityId);
        if (activity == null || activity.UserId != userId)
        {
            throw new KeyNotFoundException($"Activity with ID {activityId} not found");
        }

        if (!activity.IsActive)
        {
            throw new InvalidOperationException("Cannot update status for an archived activity");
        }

        // Parse the date from string format "YYYY-MM-DD"
        if (!DateTime.TryParseExact(request.Date, "yyyy-MM-dd", 
            System.Globalization.CultureInfo.InvariantCulture, 
            System.Globalization.DateTimeStyles.None, out var parsedDate))
        {
            throw new ArgumentException($"Invalid date format. Expected yyyy-MM-dd, got: {request.Date}");
        }
        
        // The date comes from frontend as local date string (e.g., "2026-02-06")
        // We need to preserve the exact date without timezone conversion
        var date = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
        
        Console.WriteLine($"UpdateActivityStatus: Received date string '{request.Date}', parsed as {date:yyyy-MM-dd} (Kind: {date.Kind})");
        
        // Check if log already exists for this date
        var existingLog = await _activityLogRepository.GetByActivityAndDateAsync(activityId, date);
        
        ActivityLog activityLog;
        if (existingLog != null)
        {
            // Update existing log
            existingLog.IsCompleted = request.IsCompleted;
            activityLog = await _activityLogRepository.UpdateAsync(existingLog);
        }
        else
        {
            // Create new log
            activityLog = new ActivityLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ActivityId = activityId,
                Date = date,
                IsCompleted = request.IsCompleted
            };
            activityLog = await _activityLogRepository.CreateAsync(activityLog);
        }

        return new ActivityLogResponseDto(
            Id: activityLog.Id,
            ActivityId: activityLog.ActivityId,
            Date: activityLog.Date,
            IsCompleted: activityLog.IsCompleted,
            CreatedAt: activityLog.CreatedAt
        );
    }

    public async Task<ActivityAnalyticsDto> GetActivityAnalyticsAsync(
        Guid userId, 
        Guid activityId, 
        int year, 
        int month)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        if (activity == null || activity.UserId != userId)
        {
            throw new KeyNotFoundException($"Activity with ID {activityId} not found");
        }

        var daysInMonth = DateTime.DaysInMonth(year, month);
        var todayUtc = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var currentDay = todayUtc.Month == month && todayUtc.Year == year ? todayUtc.Day : daysInMonth;

        return await CalculateActivityAnalyticsAsync(activity, userId, year, month, daysInMonth, currentDay);
    }

    private async Task<ActivityAnalyticsDto> CalculateActivityAnalyticsAsync(
        Activity activity,
        Guid userId,
        int year,
        int month,
        int daysInMonth,
        int currentDay)
    {
        // Use UTC dates for PostgreSQL compatibility
        var startOfMonth = DateTime.SpecifyKind(new DateTime(year, month, 1), DateTimeKind.Utc);
        var endOfMonth = DateTime.SpecifyKind(startOfMonth.AddDays(daysInMonth - 1), DateTimeKind.Utc);
        var today = DateTime.UtcNow.Date;
        
        // Get all logs for this activity in the specified month
        var logs = await _activityLogRepository.GetByActivityIdAsync(
            activity.Id, 
            fromDate: startOfMonth, 
            toDate: endOfMonth);
        
        // Create completion history for ALL days in the month (not just up to current day)
        var completionHistory = new List<bool>();
        // Use Date property only for comparison, normalized to UTC
        var completedDates = logs
            .Where(l => l.IsCompleted)
            .Select(l => DateTime.SpecifyKind(l.Date.Date, DateTimeKind.Utc))
            .ToHashSet();
        
        Console.WriteLine($"Activity {activity.Name}: Found {completedDates.Count} completed dates");
        foreach (var d in completedDates.Take(5))
        {
            Console.WriteLine($"  - {d:yyyy-MM-dd} (Kind: {d.Kind})");
        }
        
        // Build completion history for ALL days in the month (1 to daysInMonth)
        for (int day = 1; day <= daysInMonth; day++)
        {
            // Use UTC date for comparison, just the date portion
            var date = DateTime.SpecifyKind(new DateTime(year, month, day), DateTimeKind.Utc);
            var isCompleted = completedDates.Contains(date);
            completionHistory.Add(isCompleted);
            
            if (day <= 5 || day > daysInMonth - 2 || isCompleted) {
                Console.WriteLine($"  Day {day} ({date:yyyy-MM-dd}): completed = {isCompleted}");
            }
        }

        // Calculate statistics
        var totalCompleted = completedDates.Count;
        var todayUtc = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var isCompletedToday = todayUtc.Month == month && todayUtc.Year == year && completedDates.Contains(todayUtc);
        
        var currentStreak = CalculateCurrentStreak(completionHistory, currentDay);
        var longestStreak = CalculateLongestStreak(completionHistory);
        
        // Effort Score: (Total Completed Days / Total Days Passed in Month) * 100
        var daysPassed = currentDay;
        var effortScore = daysPassed > 0 ? Math.Round((double)totalCompleted / daysPassed * 100, 2) : 0;
        
        // Monthly Progress: (Total Completed Days / Total Days in Month) * 100
        var monthlyProgress = Math.Round((double)totalCompleted / daysInMonth * 100, 2);

        return new ActivityAnalyticsDto(
            ActivityId: activity.Id,
            ActivityName: activity.Name,
            ActivityDescription: activity.Description,
            CompletionHistory: completionHistory,
            TotalCompleted: totalCompleted,
            CurrentStreak: currentStreak,
            LongestStreak: longestStreak,
            EffortScore: effortScore,
            MonthlyProgress: monthlyProgress,
            IsCompletedToday: isCompletedToday
        );
    }

    private int CalculateCurrentStreak(List<bool> completionHistory, int currentDay)
    {
        if (completionHistory.Count == 0) return 0;

        var streak = 0;
        
        // Check if today is completed
        var todayIndex = currentDay - 1;
        if (todayIndex >= 0 && todayIndex < completionHistory.Count && completionHistory[todayIndex])
        {
            streak = 1;
            
            // Count backwards from yesterday
            for (int i = todayIndex - 1; i >= 0; i--)
            {
                if (completionHistory[i])
                {
                    streak++;
                }
                else
                {
                    break;
                }
            }
        }
        // If today is not completed, check if yesterday was completed
        else if (todayIndex > 0 && completionHistory[todayIndex - 1])
        {
            streak = 1;
            
            // Count backwards from the day before yesterday
            for (int i = todayIndex - 2; i >= 0; i--)
            {
                if (completionHistory[i])
                {
                    streak++;
                }
                else
                {
                    break;
                }
            }
        }

        return streak;
    }

    private int CalculateLongestStreak(List<bool> completionHistory)
    {
        if (completionHistory.Count == 0) return 0;

        var longestStreak = 0;
        var currentStreak = 0;

        foreach (var isCompleted in completionHistory)
        {
            if (isCompleted)
            {
                currentStreak++;
                longestStreak = Math.Max(longestStreak, currentStreak);
            }
            else
            {
                currentStreak = 0;
            }
        }

        return longestStreak;
    }
}