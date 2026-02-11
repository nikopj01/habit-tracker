using HabitTracker.Application.DTOs;

namespace HabitTracker.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponseDto> GetDashboardAsync(Guid userId, int year, int month);
    Task<ActivityLogResponseDto> UpdateActivityStatusAsync(Guid userId, Guid activityId, UpdateActivityStatusRequestDto request);
    Task<ActivityAnalyticsDto> GetActivityAnalyticsAsync(Guid userId, Guid activityId, int year, int month);
}