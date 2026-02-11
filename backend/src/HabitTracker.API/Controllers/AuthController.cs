using HabitTracker.Application.DTOs;
using HabitTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HabitTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponseDto>> SignUp([FromBody] SignUpRequestDto request)
    {
        var response = await _authService.SignUpAsync(request);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> SignIn([FromBody] SignInRequestDto request)
    {
        var response = await _authService.SignInAsync(request);
        return Ok(response);
    }
}