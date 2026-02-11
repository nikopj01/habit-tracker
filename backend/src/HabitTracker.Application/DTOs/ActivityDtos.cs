namespace HabitTracker.Application.DTOs;

public record CreateActivityRequestDto(
    string Name,
    string Description
);

public record UpdateActivityRequestDto(
    string Name,
    string Description
);

public record ActivityResponseDto(
    Guid Id,
    string Name,
    string Description,
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