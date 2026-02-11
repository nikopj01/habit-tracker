using HabitTracker.Application.DTOs;

namespace HabitTracker.Application.Interfaces;

public interface IActivityService
{
    Task<ActivityListResponseDto> GetActivitiesAsync(Guid userId, bool? isActive = null);
    Task<ActivityResponseDto> GetActivityByIdAsync(Guid userId, Guid activityId);
    Task<ActivityResponseDto> CreateActivityAsync(Guid userId, CreateActivityRequestDto request);
    Task<ActivityResponseDto> UpdateActivityAsync(Guid userId, Guid activityId, UpdateActivityRequestDto request);
    Task ArchiveActivityAsync(Guid userId, Guid activityId);
    Task RestoreActivityAsync(Guid userId, Guid activityId);
}