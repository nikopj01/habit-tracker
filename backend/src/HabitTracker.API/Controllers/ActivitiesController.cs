using HabitTracker.Application.DTOs;
using HabitTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HabitTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpGet]
    public async Task<ActionResult<ActivityListResponseDto>> GetActivities([FromQuery] bool? isActive = null)
    {
        var userId = GetCurrentUserId();
        var activities = await _activityService.GetActivitiesAsync(userId, isActive);
        return Ok(activities);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ActivityResponseDto>> GetActivity(Guid id)
    {
        var userId = GetCurrentUserId();
        var activity = await _activityService.GetActivityByIdAsync(userId, id);
        return Ok(activity);
    }

    [HttpPost]
    public async Task<ActionResult<ActivityResponseDto>> CreateActivity([FromBody] CreateActivityRequestDto request)
    {
        var userId = GetCurrentUserId();
        var activity = await _activityService.CreateActivityAsync(userId, request);
        return CreatedAtAction(nameof(GetActivity), new { id = activity.Id }, activity);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ActivityResponseDto>> UpdateActivity(Guid id, [FromBody] UpdateActivityRequestDto request)
    {
        var userId = GetCurrentUserId();
        var activity = await _activityService.UpdateActivityAsync(userId, id, request);
        return Ok(activity);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> ArchiveActivity(Guid id)
    {
        var userId = GetCurrentUserId();
        await _activityService.ArchiveActivityAsync(userId, id);
        return NoContent();
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreActivity(Guid id)
    {
        var userId = GetCurrentUserId();
        await _activityService.RestoreActivityAsync(userId, id);
        return NoContent();
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