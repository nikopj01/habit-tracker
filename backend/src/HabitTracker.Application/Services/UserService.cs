using HabitTracker.Application.DTOs;
using HabitTracker.Application.Interfaces;

namespace HabitTracker.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserProfileResponseDto> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found");
        }

        return new UserProfileResponseDto(
            Id: user.Id,
            Email: user.Email,
            Nickname: user.Nickname,
            CreatedAt: user.CreatedAt
        );
    }

    public async Task<UserProfileResponseDto> SetNicknameAsync(Guid userId, SetNicknameRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Nickname))
        {
            throw new ArgumentException("Nickname is required");
        }

        if (request.Nickname.Length > 50)
        {
            throw new ArgumentException("Nickname cannot exceed 50 characters");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found");
        }

        user.Nickname = request.Nickname;
        await _userRepository.UpdateAsync(user);

        return new UserProfileResponseDto(
            Id: user.Id,
            Email: user.Email,
            Nickname: user.Nickname,
            CreatedAt: user.CreatedAt
        );
    }
}