using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text.Json;

namespace HabitTracker.API.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        
        var problemDetails = exception switch
        {
            KeyNotFoundException => CreateProblemDetails(
                context, 
                HttpStatusCode.NotFound, 
                "Resource Not Found", 
                exception.Message),
            
            ArgumentException => CreateProblemDetails(
                context, 
                HttpStatusCode.BadRequest, 
                "Bad Request", 
                exception.Message),
            
            UnauthorizedAccessException => CreateProblemDetails(
                context, 
                HttpStatusCode.Unauthorized, 
                "Unauthorized", 
                exception.Message),
            
            InvalidOperationException => CreateProblemDetails(
                context, 
                HttpStatusCode.BadRequest, 
                "Bad Request", 
                exception.Message),
            
            _ => CreateProblemDetails(
                context, 
                HttpStatusCode.InternalServerError, 
                "Internal Server Error", 
                "An unexpected error occurred. Please try again later.")
        };

        context.Response.StatusCode = problemDetails.Status ?? (int)HttpStatusCode.InternalServerError;
        
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }

    private static ProblemDetails CreateProblemDetails(
        HttpContext context, 
        HttpStatusCode statusCode, 
        string title, 
        string detail)
    {
        return new ProblemDetails
        {
            Type = $"https://httpstatuses.com/{(int)statusCode}",
            Title = title,
            Detail = detail,
            Status = (int)statusCode,
            Instance = context.Request.Path,
            Extensions = new Dictionary<string, object?>
            {
                { "traceId", context.TraceIdentifier },
                { "timestamp", DateTime.UtcNow.ToString("O") }
            }
        };
    }
}

public static class GlobalExceptionHandlerMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
    }
}