using HabitTracker.Application.DTOs;
using HabitTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HabitTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponseDto>> GetDashboard(
        [FromQuery] int? year = null, 
        [FromQuery] int? month = null)
    {
        var userId = GetCurrentUserId();
        
        // Default to current month if not specified
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;
        
        var dashboard = await _dashboardService.GetDashboardAsync(userId, targetYear, targetMonth);
        return Ok(dashboard);
    }

    [HttpGet("activities/{activityId}/analytics")]
    public async Task<ActionResult<ActivityAnalyticsDto>> GetActivityAnalytics(
        Guid activityId,
        [FromQuery] int? year = null, 
        [FromQuery] int? month = null)
    {
        var userId = GetCurrentUserId();
        
        // Default to current month if not specified
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;
        
        var analytics = await _dashboardService.GetActivityAnalyticsAsync(userId, activityId, targetYear, targetMonth);
        return Ok(analytics);
    }

    [HttpPut("activities/{activityId}/status")]
    public async Task<ActionResult<ActivityLogResponseDto>> UpdateActivityStatus(
        Guid activityId, 
        [FromBody] UpdateActivityStatusRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await _dashboardService.UpdateActivityStatusAsync(userId, activityId, request);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }

        return userId;
    }
}