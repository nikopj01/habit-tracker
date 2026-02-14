using HabitTracker.API.Middleware;
using HabitTracker.Application.Interfaces;
using HabitTracker.Application.Services;
using HabitTracker.Infrastructure.Data;
using HabitTracker.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Avoid Windows EventLog permission issues during local development and EF tooling execution.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Add services to the container.
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();
    });

// Configure Entity Framework Core with PostgreSQL
var dbConnectionString = GetRequiredConnectionString(builder.Configuration, "DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(dbConnectionString);
});

// Register Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
builder.Services.AddScoped<IUserMonthlyActivityRepository, UserMonthlyActivityRepository>();

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

var corsAllowedOrigins = GetAllowedOrigins(builder.Configuration, builder.Environment);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(corsAllowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure JWT Authentication
var jwtSecret = GetRequiredConfiguration(builder.Configuration, "Jwt:Secret");
var jwtIssuer = GetRequiredConfiguration(builder.Configuration, "Jwt:Issuer");
var jwtAudience = GetRequiredConfiguration(builder.Configuration, "Jwt:Audience");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

 var app = builder.Build();

// Apply pending EF Core migrations on startup to keep schema in sync with code.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

// Add Global Exception Handler
app.UseGlobalExceptionHandler();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static string GetRequiredConfiguration(IConfiguration configuration, string key)
{
    var value = configuration[key];
    if (!string.IsNullOrWhiteSpace(value))
    {
        return value;
    }

    throw new InvalidOperationException($"Missing required configuration value: {key}");
}

static string GetRequiredConnectionString(IConfiguration configuration, string name)
{
    var value = configuration.GetConnectionString(name);
    if (!string.IsNullOrWhiteSpace(value))
    {
        return value;
    }

    throw new InvalidOperationException($"Missing required connection string: ConnectionStrings:{name}");
}

static string[] GetAllowedOrigins(IConfiguration configuration, IWebHostEnvironment environment)
{
    var originsFromSection = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (originsFromSection is { Length: > 0 })
    {
        return originsFromSection;
    }

    var singleValue = configuration["Cors:AllowedOrigins"];
    if (!string.IsNullOrWhiteSpace(singleValue))
    {
        return singleValue
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    }

    if (environment.IsDevelopment())
    {
        return ["http://localhost:5173"];
    }

    throw new InvalidOperationException("Missing required configuration value: Cors:AllowedOrigins");
}
