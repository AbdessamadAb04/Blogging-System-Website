using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Models;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/usersapi")]
    public class UsersApiController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly Data.AppDbContext _context;

        public UsersApiController(UserManager<ApplicationUser> userManager, Data.AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/usersapi/count
        [HttpGet("count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCounts()
        {
            try
            {
                var totalUsers = await _userManager.Users.CountAsync();
                var admins = await _userManager.GetUsersInRoleAsync("Admin");

                return Ok(new { totalUsers, adminCount = admins.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve user counts", details = ex.Message });
            }
        }

        // GET: api/usersapi
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _userManager.Users.ToListAsync();
                var result = new List<object>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    var isLockedOut = await _userManager.IsLockedOutAsync(user);

                    result.Add(new
                    {
                        id = user.Id,
                        userName = user.UserName,
                        email = user.Email,
                        registrationDate = user.RegistrationDate.ToString("o"),
                        roles = roles,
                        role = user.Role, // Using the property from ApplicationUser
                        isLockedOut
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve users", details = ex.Message });
            }
        }
        // POST: api/usersapi
        [HttpPost]
        [AllowAnonymous] // Or [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] UserCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = new ApplicationUser 
                { 
                    UserName = model.Email, 
                    Email = model.Email,
                    Role = model.Role, // Store in the column as well
                    RegistrationDate = DateTime.Now
                };
                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    // Assign role if provided, default to "User"
                    var role = !string.IsNullOrEmpty(model.Role) ? model.Role : "User";
                    
                    // Add to Identity Roles as well
                    await _userManager.AddToRoleAsync(user, role);

                    // Add to Newsletter if requested
                    if (model.IsNewsletterSubscribed)
                    {
                        var subscriber = new NewsletterSubscriber
                        {
                            Email = user.Email,
                            SubscribedAt = DateTime.Now,
                            UserId = user.Id
                        };
                        _context.NewsletterSubscribers.Add(subscriber);
                        await _context.SaveChangesAsync();
                    }

                    return Ok(new { success = true, message = "User created successfully", id = user.Id });
                }

                return BadRequest(new { success = false, errors = result.Errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create user", details = ex.Message });
            }
        }

        // GET: api/usersapi/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserById(string id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                var roles = await _userManager.GetRolesAsync(user);
                var isSubscribed = await _context.NewsletterSubscribers.AnyAsync(s => s.Email == user.Email);

                return Ok(new
                {
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email,
                    role = user.Role,
                    roles = roles,
                    isNewsletterSubscribed = isSubscribed
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve user", details = ex.Message });
            }
        }

        // POST: api/usersapi/update/{id}
        [HttpPost("update/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Update(string id, [FromBody] UserUpdateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                // Prevent updating the main admin email/role if necessary
                if (user.Email == "admin@example.com" && model.Email != "admin@example.com")
                {
                    return BadRequest(new { error = "Cannot change the email of the primary admin." });
                }

                user.Email = model.Email;
                user.UserName = model.Email;
                user.Role = model.Role;

                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    // Update password if provided
                    if (!string.IsNullOrEmpty(model.Password))
                    {
                        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                        await _userManager.ResetPasswordAsync(user, token, model.Password);
                    }

                    // Update Newsletter Subscription
                    var existingSub = await _context.NewsletterSubscribers.FirstOrDefaultAsync(s => s.Email == user.Email);
                    if (model.IsNewsletterSubscribed && existingSub == null)
                    {
                        _context.NewsletterSubscribers.Add(new NewsletterSubscriber
                        {
                            Email = user.Email,
                            SubscribedAt = DateTime.Now,
                            UserId = user.Id
                        });
                    }
                    else if (!model.IsNewsletterSubscribed && existingSub != null)
                    {
                        _context.NewsletterSubscribers.Remove(existingSub);
                    }
                    await _context.SaveChangesAsync();

                    // Update roles
                    var currentRoles = await _userManager.GetRolesAsync(user);
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    await _userManager.AddToRoleAsync(user, model.Role);

                    return Ok(new { success = true, message = "User updated successfully" });
                }

                return BadRequest(new { success = false, errors = result.Errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update user", details = ex.Message });
            }
        }

        // DELETE: api/usersapi/{id}
        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                if (user.Email == "admin@example.com")
                {
                    return BadRequest(new { error = "Cannot delete the primary admin user." });
                }

                var result = await _userManager.DeleteAsync(user);
                if (result.Succeeded)
                {
                    return Ok(new { success = true, message = "User deleted successfully" });
                }

                return BadRequest(new { success = false, errors = result.Errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete user", details = ex.Message });
            }
        }
    }

    public class UserCreateDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public bool IsNewsletterSubscribed { get; set; }
    }

    public class UserUpdateDto
    {
        public string Email { get; set; }
        public string Role { get; set; }
        public string? Password { get; set; }
        public bool IsNewsletterSubscribed { get; set; }
    }
}
