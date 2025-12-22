using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;
using SyncSyntax.Models;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/newsletterapi")]
    public class NewsletterApiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NewsletterApiController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/newsletterapi
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetNewsletterSubscribers()
        {
            try
            {
                // Return a stable DTO for subscribers including optional fields the frontend expects.
                var subscribers = await _context.NewsletterSubscribers
                    .OrderByDescending(s => s.SubscribedAt)
                    .Select(s => new
                    {
                        id = s.Id,
                        email = s.Email,
                        // return the nullable UserId (string) from the schema
                        userId = s.UserId,
                        subscribedAt = s.SubscribedAt
                    })
                    .ToListAsync();

                return Ok(subscribers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve newsletter subscribers", details = ex.Message });
            }
        }

        // GET: api/newsletterapi/count
        [HttpGet("count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSubscribersCount()
        {
            try
            {
                var totalSubscribers = await _context.NewsletterSubscribers.CountAsync();

                return Ok(new { totalSubscribers });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve subscribers count", details = ex.Message });
            }
        }
        // POST: api/newsletterapi
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] NewsletterSubscriberCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Check if already subscribed
                var existing = await _context.NewsletterSubscribers.FirstOrDefaultAsync(s => s.Email == model.Email);
                if (existing != null)
                {
                    return Ok(new { success = true, message = "You are already subscribed!", id = existing.Id });
                }

                string? userId = null;
                if (User.Identity.IsAuthenticated)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
                    userId = user?.Id;
                }

                var subscriber = new NewsletterSubscriber
                {
                    Email = model.Email,
                    SubscribedAt = DateTime.Now,
                    UserId = userId
                };

                _context.NewsletterSubscribers.Add(subscriber);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Subscriber created successfully", id = subscriber.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create subscriber", details = ex.Message });
            }
        }

        // DELETE: api/newsletterapi/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var subscriber = await _context.NewsletterSubscribers.FindAsync(id);
                if (subscriber == null)
                {
                    return NotFound(new { error = "Subscriber not found" });
                }

                _context.NewsletterSubscribers.Remove(subscriber);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Subscriber deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete subscriber", details = ex.Message });
            }
        }
    }

    public class NewsletterSubscriberCreateDto
    {
        public string Email { get; set; }
    }
}
