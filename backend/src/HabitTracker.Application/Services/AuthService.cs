using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using HabitTracker.Application.DTOs;
using HabitTracker.Application.Entities;
using HabitTracker.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HabitTracker.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> SignUpAsync(SignUpRequestDto request)
    {
        // Validate email format
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            throw new ArgumentException("Invalid email address");
        }

        // Validate password
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            throw new ArgumentException("Password must be at least 6 characters long");
        }

        if (string.IsNullOrWhiteSpace(request.Nickname))
        {
            throw new ArgumentException("Nickname is required");
        }

        if (request.Nickname.Trim().Length > 50)
        {
            throw new ArgumentException("Nickname cannot exceed 50 characters");
        }

        // Check if user already exists
        if (await _userRepository.ExistsByEmailAsync(request.Email))
        {
            throw new InvalidOperationException("A user with this email already exists");
        }

        // Hash the password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower().Trim(),
            PasswordHash = passwordHash,
            Nickname = request.Nickname.Trim()
        };

        await _userRepository.CreateAsync(user);

        // Generate JWT tokens
        var accessToken = GenerateJwtToken(user.Id, user.Email, false);
        var refreshToken = GenerateRefreshToken();

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            UserId: user.Id,
            Email: user.Email,
            RequiresProfileSetup: false // Nickname is set from email by default
        );
    }

    public async Task<AuthResponseDto> SignInAsync(SignInRequestDto request)
    {
        // Validate inputs
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Email and password are required");
        }

        // Find user by email
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Generate JWT tokens with extended expiration if Remember Me is enabled
        var accessToken = GenerateJwtToken(user.Id, user.Email, request.RememberMe);
        var refreshToken = GenerateRefreshToken();

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            UserId: user.Id,
            Email: user.Email,
            RequiresProfileSetup: false // Nickname is now set from email by default
        );
    }

    private string GenerateJwtToken(Guid userId, string email, bool rememberMe = false)
    {
        var jwtSecret = _configuration["Jwt:Secret"] ?? "your-super-secret-key-that-is-at-least-32-characters-long";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "HabitTracker";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "HabitTrackerClient";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("rememberMe", rememberMe.ToString())
        };

        // Extended expiration for Remember Me (30 days) vs normal (24 hours)
        var expiration = rememberMe ? DateTime.UtcNow.AddDays(30) : DateTime.UtcNow.AddHours(24);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        return Guid.NewGuid().ToString();
    }
}
