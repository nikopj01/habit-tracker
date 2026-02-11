using HabitTracker.Application.DTOs;

namespace HabitTracker.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileResponseDto> GetProfileAsync(Guid userId);
    Task<UserProfileResponseDto> SetNicknameAsync(Guid userId, SetNicknameRequestDto request);
}