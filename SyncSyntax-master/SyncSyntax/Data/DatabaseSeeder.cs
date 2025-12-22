using Microsoft.AspNetCore.Identity;
using SyncSyntax.Models;

namespace SyncSyntax.Data
{
    public class DatabaseSeeder
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public DatabaseSeeder(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task SeedAsync()
        {
            // Seed roles
            string[] roles = { "Admin", "User" };
            foreach (var role in roles)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // Seed admin user
            if (await _userManager.FindByEmailAsync("admin@example.com") == null)
            {
                var adminUser = new ApplicationUser 
                { 
                    UserName = "admin@example.com", 
                    Email = "admin@example.com",
                    RegistrationDate = DateTime.Now,
                    Role = "Admin"
                };
                await _userManager.CreateAsync(adminUser, "Admin@123");
                await _userManager.AddToRoleAsync(adminUser, "Admin");
            }

            // Seed regular user
            if (await _userManager.FindByEmailAsync("user@example.com") == null)
            {
                var regularUser = new ApplicationUser 
                { 
                    UserName = "user@example.com", 
                    Email = "user@example.com",
                    RegistrationDate = DateTime.Now,
                    Role = "User"
                };
                await _userManager.CreateAsync(regularUser, "User@123");
                await _userManager.AddToRoleAsync(regularUser, "User");
            }
        }
    }
}
