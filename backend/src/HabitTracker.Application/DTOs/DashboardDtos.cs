namespace HabitTracker.Application.DTOs;

public class UpdateActivityStatusRequestDto
{
    // Use string to receive the date in YYYY-MM-DD format, then parse it manually
    public string Date { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
}

public record ActivityAnalyticsDto(
    Guid ActivityId,
    string ActivityName,
    string ActivityDescription,
    List<bool> CompletionHistory,
    int TotalCompleted,
    int CurrentStreak,
    int LongestStreak,
    double EffortScore,
    double MonthlyProgress,
    bool IsCompletedToday
);

public record DashboardResponseDto(
    int Year,
    int Month,
    int DaysInMonth,
    int CurrentDay,
    List<ActivityAnalyticsDto> Activities
);

public record ActivityLogResponseDto(
    Guid Id,
    Guid ActivityId,
    DateTime Date,
    bool IsCompleted,
    DateTime CreatedAt
);