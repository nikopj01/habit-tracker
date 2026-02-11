using HabitTracker.Application.DTOs;

namespace HabitTracker.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> SignUpAsync(SignUpRequestDto request);
    Task<AuthResponseDto> SignInAsync(SignInRequestDto request);
}