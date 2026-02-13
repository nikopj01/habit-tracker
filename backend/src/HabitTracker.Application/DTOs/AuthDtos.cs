namespace HabitTracker.Application.DTOs;

public record SignUpRequestDto(
    string Email,
    string Password,
    string Nickname
);

public record SignInRequestDto(
    string Email,
    string Password,
    bool RememberMe = false
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    Guid UserId,
    string Email,
    bool RequiresProfileSetup
);

public record SetNicknameRequestDto(
    string Nickname
);

public record UserProfileResponseDto(
    Guid Id,
    string Email,
    string Nickname,
    DateTime CreatedAt
);

public record UserDto(
    Guid Id,
    string Email,
    string Nickname,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
