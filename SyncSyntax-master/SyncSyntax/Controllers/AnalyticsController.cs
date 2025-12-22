using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/analytics/engagement-monthly
        [HttpGet("engagement-monthly")]
        [AllowAnonymous]
        public async Task<IActionResult> GetEngagementMonthly()
        {
            try
            {
                var now = DateTime.Now;
                var results = new List<object>();

                for (int i = 11; i >= 0; i--)
                {
                    var start = new DateTime(now.Year, now.Month, 1).AddMonths(-i);
                    var end = start.AddMonths(1);

                    var likes = await _context.PostLikes
                        .Where(l => l.LikedAt >= start && l.LikedAt < end)
                        .CountAsync();

                    var comments = await _context.Comments
                        .Where(c => c.CommentDate >= start && c.CommentDate < end)
                        .CountAsync();

                    results.Add(new
                    {
                        month = start.ToString("yyyy-MM"),
                        label = start.ToString("MMM yy"),
                        likes,
                        comments
                    });
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to compute engagement monthly", details = ex.Message });
            }
        }
    }
}
