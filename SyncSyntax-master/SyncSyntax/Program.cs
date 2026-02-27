using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;   
using SyncSyntax.Data;
using SyncSyntax.Models;
using SyncSyntax.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10485760; // 10 MB
});
// Add services to the container. Use API controllers only (no server-side views).
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Add CORS policy for React frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173", 
                "http://localhost:5174",
                "http://localhost:4173"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials() // Enable credentials for authentication cookies
              .SetIsOriginAllowed(origin => 
                  origin.StartsWith("http://localhost:") || 
                  origin.StartsWith("https://localhost:")
              );
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Add MongoDB service for Voyagestics database
builder.Services.AddSingleton<MongoDbService>();
builder.Services.AddScoped<MongoRepository>();

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 1; // Set to a very low value if needed
    options.Password.RequiredUniqueChars = 0; // No unique characters required
})
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Auth/SignIn";  // Redirect path for unauthorized users
    options.AccessDeniedPath = "/Auth/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
    options.Events = new Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = 401;
            }
            else
            {
                context.Response.Redirect(context.RedirectUri);
            }
            return Task.CompletedTask;
        },
        OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = 403;
            }
            else
            {
                context.Response.Redirect(context.RedirectUri);
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddTransient<DatabaseSeeder>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler();
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

// Enable CORS - must be after UseRouting and before UseAuthentication
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    // Critical Data Fix: Update NULL PublishedDate to current date to prevent SqlNullValueException
    try 
    {
        await context.Database.ExecuteSqlRawAsync("UPDATE Posts SET PublishedDate = GETDATE() WHERE PublishedDate IS NULL");
        // Ensure FeatureImagePath is not null if required
        await context.Database.ExecuteSqlRawAsync("UPDATE Posts SET FeatureImagePath = '' WHERE FeatureImagePath IS NULL");
        
        // Fix: Add UserId column to Comments if it doesn't exist
        try {
            await context.Database.ExecuteSqlRawAsync("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Comments]') AND name = N'UserId') BEGIN ALTER TABLE [Comments] ADD [UserId] nvarchar(max) NULL; END");
            await context.Database.ExecuteSqlRawAsync("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[AspNetUsers]') AND name = N'FullName') BEGIN ALTER TABLE [AspNetUsers] ADD [FullName] nvarchar(256) NULL; END");
            // Also ensure UserName is updated if needed, but UserId is the critical one for now.
            // If there are existing comments, they might need a dummy UserId if we want to make it Required later.
            // For now, making it nullable in SQL even if Required in C# model (EF will handle validation on Save).
        } catch (Exception dbEx) {
            Console.WriteLine($"Migration Fix Error: {dbEx.Message}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error applying data fix: {ex.Message}");
    }

    var seeder = services.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();

    // Initialize MongoDB collections
    var mongoRepo = services.GetRequiredService<MongoRepository>();
    await mongoRepo.InitializeCollectionsAsync();
}

app.Run();
