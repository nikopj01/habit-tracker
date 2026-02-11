using HabitTracker.Application.DTOs;
using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;

namespace HabitTracker.Application.Services;

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activityRepository;
    private const int MaxActiveActivities = 10;

    public ActivityService(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<ActivityListResponseDto> GetActivitiesAsync(Guid userId, bool? isActive = null)
    {
        var activities = await _activityRepository.GetByUserIdAsync(userId, isActive);
        var activityDtos = activities.Select(a => new ActivityResponseDto(
            a.Id,
            a.Name,
            a.Description,
            a.IsActive,
            a.ArchivedAt,
            a.CreatedAt
        )).ToList();

        var activeCount = await _activityRepository.GetActiveCountByUserIdAsync(userId);
        var totalCount = activityDtos.Count;
        var remainingSlots = MaxActiveActivities - activeCount;

        return new ActivityListResponseDto(
            activityDtos,
            totalCount,
            activeCount,
            remainingSlots
        );
    }

    public async Task<ActivityResponseDto> GetActivityByIdAsync(Guid userId, Guid activityId)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        
        if (activity == null || activity.UserId != userId)
        {
            throw new KeyNotFoundException($"Activity with ID {activityId} not found");
        }

        return new ActivityResponseDto(
            activity.Id,
            activity.Name,
            activity.Description,
            activity.IsActive,
            activity.ArchivedAt,
            activity.CreatedAt
        );
    }

    public async Task<ActivityResponseDto> CreateActivityAsync(Guid userId, CreateActivityRequestDto request)
    {
        // Check if user has reached the limit of 10 active activities
        var activeCount = await _activityRepository.GetActiveCountByUserIdAsync(userId);
        if (activeCount >= MaxActiveActivities)
        {
            throw new InvalidOperationException($"You have reached the maximum limit of {MaxActiveActivities} active activities. Please archive an existing activity first.");
        }

        // Check for duplicate names
        if (await _activityRepository.ExistsByNameAsync(userId, request.Name))
        {
            throw new ArgumentException($"An activity with the name '{request.Name}' already exists");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Activity name is required");
        }

        if (request.Name.Length > 100)
        {
            throw new ArgumentException("Activity name cannot exceed 100 characters");
        }

        if (request.Description?.Length > 500)
        {
            throw new ArgumentException("Activity description cannot exceed 500 characters");
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            IsActive = true
        };

        var createdActivity = await _activityRepository.CreateAsync(activity);

        return new ActivityResponseDto(
            createdActivity.Id,
            createdActivity.Name,
            createdActivity.Description,
            createdActivity.IsActive,
            createdActivity.ArchivedAt,
            createdActivity.CreatedAt
        );
    }

    public async Task<ActivityResponseDto> UpdateActivityAsync(Guid userId, Guid activityId, UpdateActivityRequestDto request)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        
        if (activity == null || activity.UserId != userId)
        {
            throw new KeyNotFoundException($"Activity with ID {activityId} not found");
        }

        if (!activity.IsActive)
        {
            throw new InvalidOperationException("Cannot update an archived activity. Please restore it first.");
        }

        // Check for duplicate names (excluding current activity)
        var existingActivities = await _activityRepository.GetByUserIdAsync(userId, true);
        if (existingActivities.Any(a => a.Id != activityId && 
                                        a.Name.ToLower() == request.Name.ToLower()))
        {
            throw new ArgumentException($"An activity with the name '{request.Name}' already exists");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Activity name is required");
        }

        if (request.Name.Length > 100)
        {
            throw new ArgumentException("Activity name cannot exceed 100 characters");
        }

        if (request.Description?.Length > 500)
        {
            throw new ArgumentException("Activity description cannot exceed 500 characters");
        }

        activity.Name = request.Name.Trim();
        activity.Description = request.Description?.Trim() ?? string.Empty;

        var updatedActivity = await _activityRepository.UpdateAsync(activity);

        return new ActivityResponseDto(
            updatedActivity.Id,
            updatedActivity.Name,
            updatedActivity.Description,
            updatedActivity.IsActive,
            updatedActivity.ArchivedAt,
            updatedActivity.CreatedAt
        );
    }

    public async Task ArchiveActivityAsync(Guid userId, Guid activityId)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        
        if (activity == null || activity.UserId != userId)
        {
            throw new KeyNotFoundException($"Activity with ID {activityId} not found");
        }

        if (!activity.IsActive)
        {
            throw new InvalidOperationException("Activity is already archived");
        }

        activity.IsActive = false;
        activity.ArchivedAt = DateTime.UtcNow;

        await _activityRepository.UpdateAsync(activity);
    }

    public async Task RestoreActivityAsync(Guid userId, Guid activityId)
    {
        var activity = await _activityRepository.GetByIdAsync(activityId);
        
        if (activity == null || activity.UserId != userId)
        {
            throw new KeyNotFoundException($"Activity with ID {activityId} not found");
        }

        if (activity.IsActive)
        {
            throw new InvalidOperationException("Activity is already active");
        }

        // Check if restoring would exceed the limit
        var activeCount = await _activityRepository.GetActiveCountByUserIdAsync(userId);
        if (activeCount >= MaxActiveActivities)
        {
            throw new InvalidOperationException($"Cannot restore activity. You already have {MaxActiveActivities} active activities.");
        }

        activity.IsActive = true;
        activity.ArchivedAt = null;

        await _activityRepository.UpdateAsync(activity);
    }
}