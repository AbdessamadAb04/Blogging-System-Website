using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SyncSyntax.Models.ViewModels;
using SyncSyntax.Models;
using SyncSyntax.Data;
using Microsoft.EntityFrameworkCore;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthApiController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly AppDbContext _context;

        public AuthApiController(SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            AppDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] SignUpApiModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        );
                    return BadRequest(new { success = false, errors });
                }

                var user = new ApplicationUser 
                { 
                    UserName = model.Email, 
                    Email = model.Email,
                    FullName = model.FullName,
                    RegistrationDate = DateTime.Now,
                    Role = "User" 
                };
                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    // Ensure the User role exists
                    if (!await _roleManager.RoleExistsAsync("User"))
                    {
                        await _roleManager.CreateAsync(new IdentityRole("User"));
                    }
                    // Assign the User role to the newly created user
                    await _userManager.AddToRoleAsync(user, "User");
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    
                    return Ok(new { 
                        success = true, 
                        message = "Account created successfully",
                        user = new { email = user.Email, id = user.Id }
                    });
                }

                var signUpErrors = result.Errors.ToDictionary(
                    error => "general",
                    error => new[] { error.Description }
                );
                
                return BadRequest(new { success = false, errors = signUpErrors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred during registration",
                    error = ex.Message 
                });
            }
        }

        [HttpPost("signin")]
        public async Task<IActionResult> SignIn([FromBody] SignInApiModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        );
                    return BadRequest(new { success = false, errors });
                }

                var user = await _userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        errors = new { general = new[] { "Invalid email or password" } }
                    });
                }

                var signInResult = await _signInManager.PasswordSignInAsync(user, model.Password, isPersistent: model.RememberMe, lockoutOnFailure: false);

                if (!signInResult.Succeeded)
                {
                    return BadRequest(new { 
                        success = false, 
                        errors = new { general = new[] { "Invalid email or password" } }
                    });
                }

                return Ok(new { 
                    success = true, 
                    message = "Signed in successfully",
                    user = new { email = user.Email, id = user.Id }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred during sign in",
                    error = ex.Message 
                });
            }
        }

        [HttpPost("signout")]
        public async Task<IActionResult> SignOut()
        {
            try
            {
                await _signInManager.SignOutAsync();
                return Ok(new { success = true, message = "Signed out successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred during sign out",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetAuthStatus()
        {
            try
            {
                if (User.Identity.IsAuthenticated)
                {
                    var user = await _userManager.GetUserAsync(User);
                    var isSubscribed = await _context.NewsletterSubscribers.AnyAsync(s => s.Email == user.Email);
                    
                    return Ok(new { 
                        isAuthenticated = true,
                        user = new { 
                            email = user.Email, 
                            id = user.Id, 
                            fullName = user.FullName,
                            role = user.Role,
                            isNewsletterSubscribed = isSubscribed
                        }
                    });
                }
                
                return Ok(new { isAuthenticated = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred checking auth status",
                    error = ex.Message 
                });
            }
        }
    }

    // API Models for cleaner validation
    public class SignUpApiModel
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class SignInApiModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}