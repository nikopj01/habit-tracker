using HabitTracker.Application.DTOs;
using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;
using HabitTracker.Application.Constants;

namespace HabitTracker.Application.Services;

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IUserMonthlyActivityRepository _userMonthlyActivityRepository;
    private const int MaxActiveActivities = 10;

    public ActivityService(
        IActivityRepository activityRepository,
        IUserMonthlyActivityRepository userMonthlyActivityRepository)
    {
        _activityRepository = activityRepository;
        _userMonthlyActivityRepository = userMonthlyActivityRepository;
    }

    public async Task<ActivityListResponseDto> GetActivitiesAsync(Guid userId, bool? isActive = null)
    {
        var activities = await _activityRepository.GetByUserIdAsync(userId, isActive);
        var activityDtos = activities.Select(a => new ActivityResponseDto(
            a.Id,
            a.Name,
            a.Description,
            a.Icon,
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
            activity.Icon,
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

        ValidateIcon(request.Icon);

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Icon = request.Icon.Trim(),
            IsActive = true
        };

        var createdActivity = await _activityRepository.CreateAsync(activity);

        return new ActivityResponseDto(
            createdActivity.Id,
            createdActivity.Name,
            createdActivity.Description,
            createdActivity.Icon,
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

        ValidateIcon(request.Icon);

        activity.Name = request.Name.Trim();
        activity.Description = request.Description?.Trim() ?? string.Empty;
        activity.Icon = request.Icon.Trim();

        var updatedActivity = await _activityRepository.UpdateAsync(activity);

        return new ActivityResponseDto(
            updatedActivity.Id,
            updatedActivity.Name,
            updatedActivity.Description,
            updatedActivity.Icon,
            updatedActivity.IsActive,
            updatedActivity.ArchivedAt,
            updatedActivity.CreatedAt
        );
    }

    public async Task<MonthlyActivityPlanResponseDto> GetMonthlyPlanAsync(Guid userId, int year, int month)
    {
        ValidateYearAndMonth(year, month);
        await EnsureMonthSelectionInitializedAsync(userId, year, month);

        var monthRows = await _userMonthlyActivityRepository.GetByUserAndMonthAsync(userId, year, month);
        var selectedIds = monthRows.Where(x => x.IsActive).Select(x => x.ActivityId).ToHashSet();
        var allActivities = (await _activityRepository.GetByUserIdAsync(userId, isActive: null)).ToList();

        var items = allActivities
            .Select(activity => new MonthlyActivityPlanItemDto(
                ActivityId: activity.Id,
                Name: activity.Name,
                Description: activity.Description,
                Icon: activity.Icon,
                IsSelected: selectedIds.Contains(activity.Id),
                IsArchived: !activity.IsActive))
            .ToList();

        return new MonthlyActivityPlanResponseDto(
            Year: year,
            Month: month,
            MaxActivities: MaxActiveActivities,
            SelectedCount: selectedIds.Count,
            Activities: items);
    }

    public async Task<MonthlyActivityPlanResponseDto> UpdateMonthlyPlanAsync(Guid userId, MonthlyActivityPlanRequestDto request)
    {
        ValidateYearAndMonth(request.Year, request.Month);

        var selectedIds = request.ActivityIds.Distinct().ToList();
        if (selectedIds.Count > MaxActiveActivities)
        {
            throw new ArgumentException($"You can select at most {MaxActiveActivities} activities for a month");
        }

        var allActivities = (await _activityRepository.GetByUserIdAsync(userId, isActive: null)).ToList();
        var allActivityIds = allActivities.Select(x => x.Id).ToHashSet();
        var invalidIds = selectedIds.Where(id => !allActivityIds.Contains(id)).ToList();
        if (invalidIds.Count > 0)
        {
            throw new ArgumentException("Monthly plan contains activities that do not belong to the current user");
        }

        await _userMonthlyActivityRepository.ReplaceMonthSelectionAsync(userId, request.Year, request.Month, selectedIds);

        var rows = await _userMonthlyActivityRepository.GetByUserAndMonthAsync(userId, request.Year, request.Month);
        var selectedSet = rows.Where(x => x.IsActive).Select(x => x.ActivityId).ToHashSet();

        var items = allActivities
            .Select(activity => new MonthlyActivityPlanItemDto(
                ActivityId: activity.Id,
                Name: activity.Name,
                Description: activity.Description,
                Icon: activity.Icon,
                IsSelected: selectedSet.Contains(activity.Id),
                IsArchived: !activity.IsActive))
            .ToList();

        return new MonthlyActivityPlanResponseDto(
            Year: request.Year,
            Month: request.Month,
            MaxActivities: MaxActiveActivities,
            SelectedCount: selectedSet.Count,
            Activities: items);
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

    private static void ValidateIcon(string icon)
    {
        if (string.IsNullOrWhiteSpace(icon))
        {
            throw new ArgumentException("Activity icon is required");
        }

        var normalizedIcon = icon.Trim();
        if (normalizedIcon.Length > 16)
        {
            throw new ArgumentException("Activity icon cannot exceed 16 characters");
        }

        if (!ActivityIconOptions.Allowed.Contains(normalizedIcon))
        {
            throw new ArgumentException("Unsupported activity icon");
        }
    }

    private static void ValidateYearAndMonth(int year, int month)
    {
        if (year is < 2000 or > 2100)
        {
            throw new ArgumentException("Year must be between 2000 and 2100");
        }

        if (month is < 1 or > 12)
        {
            throw new ArgumentException("Month must be between 1 and 12");
        }
    }

    private async Task EnsureMonthSelectionInitializedAsync(Guid userId, int year, int month)
    {
        var currentRows = await _userMonthlyActivityRepository.GetByUserAndMonthAsync(userId, year, month);
        if (currentRows.Count > 0)
        {
            return;
        }

        var targetDate = new DateTime(year, month, 1);
        var previous = targetDate.AddMonths(-1);
        var previousRows = await _userMonthlyActivityRepository.GetByUserAndMonthAsync(userId, previous.Year, previous.Month);

        var seedIds = previousRows
            .Where(x => x.IsActive)
            .Select(x => x.ActivityId)
            .Distinct()
            .ToList();

        if (seedIds.Count == 0)
        {
            seedIds = (await _activityRepository.GetByUserIdAsync(userId, isActive: true))
                .Select(x => x.Id)
                .Take(MaxActiveActivities)
                .ToList();
        }

        await _userMonthlyActivityRepository.CreateMonthSelectionIfMissingAsync(userId, year, month, seedIds);
    }
}
