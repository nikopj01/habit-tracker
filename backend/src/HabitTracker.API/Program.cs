using HabitTracker.API.Middleware;
using HabitTracker.Application.Interfaces;
using HabitTracker.Application.Services;
using HabitTracker.Infrastructure.Data;
using HabitTracker.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

ConfigurePortBinding(builder);

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
var dbConnectionString = GetDatabaseConnectionString(builder.Configuration);
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(dbConnectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
        npgsqlOptions.CommandTimeout(30);
    });
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

var applyMigrationsOnStartup = GetBoolConfiguration(
    builder.Configuration,
    "APPLY_MIGRATIONS_ON_STARTUP",
    builder.Environment.IsDevelopment());

// Apply pending EF Core migrations on startup only when explicitly enabled.
if (applyMigrationsOnStartup)
{
    using var scope = app.Services.CreateScope();
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

var useHttpsRedirection = GetBoolConfiguration(
    builder.Configuration,
    "USE_HTTPS_REDIRECTION",
    !builder.Environment.IsDevelopment());
if (useHttpsRedirection)
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

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

static string GetDatabaseConnectionString(IConfiguration configuration)
{
    var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(configuredConnectionString))
    {
        return configuredConnectionString;
    }

    var host = configuration["DB_HOST"];
    var database = configuration["DB_NAME"];
    var username = configuration["DB_USER"];
    var password = configuration["DB_PASSWORD"];
    var port = GetIntConfiguration(configuration, "DB_PORT", 5432);

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(database) ||
        string.IsNullOrWhiteSpace(username) ||
        string.IsNullOrWhiteSpace(password))
    {
        throw new InvalidOperationException(
            "Missing database configuration. Set ConnectionStrings:DefaultConnection or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD.");
    }

    var sslMode = ParseSslMode(configuration["DB_SSL_MODE"] ?? "Require");
    var pooling = GetBoolConfiguration(configuration, "DB_POOLING", true);
    var timeout = GetIntConfiguration(configuration, "DB_TIMEOUT", 15);
    var commandTimeout = GetIntConfiguration(configuration, "DB_COMMAND_TIMEOUT", 30);
    var maxPoolSize = GetIntConfiguration(configuration, "DB_MAX_POOL_SIZE", 100);

    var connectionStringBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = host,
        Port = port,
        Database = database,
        Username = username,
        Password = password,
        SslMode = sslMode,
        Pooling = pooling,
        Timeout = timeout,
        CommandTimeout = commandTimeout,
        MaxPoolSize = maxPoolSize
    };

    return connectionStringBuilder.ConnectionString;
}

static string[] GetAllowedOrigins(IConfiguration configuration, IWebHostEnvironment environment)
{
    var singleValue = configuration["Cors:AllowedOrigins"];
    if (!string.IsNullOrWhiteSpace(singleValue))
    {
        return singleValue
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    }

    var originsFromSection = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (originsFromSection is { Length: > 0 })
    {
        return originsFromSection;
    }

    if (environment.IsDevelopment())
    {
        return ["http://localhost:5173"];
    }

    throw new InvalidOperationException("Missing required configuration value: Cors:AllowedOrigins");
}

static bool GetBoolConfiguration(IConfiguration configuration, string key, bool defaultValue)
{
    var value = configuration[key];
    if (string.IsNullOrWhiteSpace(value))
    {
        return defaultValue;
    }

    if (bool.TryParse(value, out var parsed))
    {
        return parsed;
    }

    throw new InvalidOperationException($"Invalid boolean configuration value for {key}: {value}");
}

static int GetIntConfiguration(IConfiguration configuration, string key, int defaultValue)
{
    var value = configuration[key];
    if (string.IsNullOrWhiteSpace(value))
    {
        return defaultValue;
    }

    if (int.TryParse(value, out var parsed) && parsed > 0)
    {
        return parsed;
    }

    throw new InvalidOperationException($"Invalid integer configuration value for {key}: {value}");
}

static SslMode ParseSslMode(string value)
{
    if (Enum.TryParse<SslMode>(value, ignoreCase: true, out var parsed))
    {
        return parsed;
    }

    throw new InvalidOperationException($"Invalid DB_SSL_MODE value: {value}");
}

static void ConfigurePortBinding(WebApplicationBuilder builder)
{
    var portValue = builder.Configuration["PORT"];
    if (string.IsNullOrWhiteSpace(portValue))
    {
        return;
    }

    if (!int.TryParse(portValue, out var port) || port <= 0)
    {
        throw new InvalidOperationException($"Invalid PORT value: {portValue}");
    }

    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}
