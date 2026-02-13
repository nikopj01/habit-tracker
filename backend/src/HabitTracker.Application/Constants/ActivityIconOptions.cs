namespace HabitTracker.Application.Constants;

public static class ActivityIconOptions
{
    public static readonly HashSet<string> Allowed = new(StringComparer.Ordinal)
    {
        "✅",
        "🏃",
        "💪",
        "📚",
        "🧘",
        "💧",
        "🍎",
        "🛌",
        "🧹",
        "💻",
        "📝",
        "🎯"
    };

    public const string DefaultIcon = "✅";
}
