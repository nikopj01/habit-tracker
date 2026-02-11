namespace HabitTracker.Application.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}