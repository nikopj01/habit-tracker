namespace HabitTracker.Application.DTOs;

public record CreateActivityRequestDto(
    string Name,
    string Description,
    string Icon
);

public record UpdateActivityRequestDto(
    string Name,
    string Description,
    string Icon
);

public record ActivityResponseDto(
    Guid Id,
    string Name,
    string Description,
    string Icon,
    bool IsActive,
    DateTime? ArchivedAt,
    DateTime CreatedAt
);

public record ActivityListResponseDto(
    List<ActivityResponseDto> Activities,
    int TotalCount,
    int ActiveCount,
    int RemainingSlots
);

public record MonthlyActivityPlanRequestDto(
    int Year,
    int Month,
    List<Guid> ActivityIds
);

public record MonthlyActivityPlanItemDto(
    Guid ActivityId,
    string Name,
    string Description,
    string Icon,
    bool IsSelected,
    bool IsArchived
);

public record MonthlyActivityPlanResponseDto(
    int Year,
    int Month,
    int MaxActivities,
    int SelectedCount,
    List<MonthlyActivityPlanItemDto> Activities
);
