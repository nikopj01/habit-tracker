namespace HabitTracker.Application.Entities;

public class UserMonthlyActivity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ActivityId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public User User { get; set; } = null!;
    public Activity Activity { get; set; } = null!;
}
