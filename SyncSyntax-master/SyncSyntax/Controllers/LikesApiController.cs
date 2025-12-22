using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;
using SyncSyntax.Models;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/likes")]
    public class LikesApiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LikesApiController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/likes/{postId}/count
        [HttpGet("{postId}/count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLikeCount(int postId)
        {
            try
            {
                var count = await _context.PostLikes
                    .Where(pl => pl.PostId == postId)
                    .CountAsync();

                return Ok(new { postId, likeCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve like count", details = ex.Message });
            }
        }

        // GET: api/likes/{postId}/user/{userId}
        [HttpGet("{postId}/user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckUserLike(int postId, string userId)
        {
            try
            {
                var hasLiked = await _context.PostLikes
                    .AnyAsync(pl => pl.PostId == postId && pl.UserId == userId);

                return Ok(new { postId, userId, hasLiked });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to check like status", details = ex.Message });
            }
        }

        // POST: api/likes
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> LikePost([FromBody] LikeRequest request)
        {
            try
            {
                // Validate that the post exists
                var postExists = await _context.Posts.AnyAsync(p => p.Id == request.PostId);
                if (!postExists)
                {
                    return NotFound(new { error = "Post not found" });
                }

                // Check if this user already liked this post
                var existingLike = await _context.PostLikes
                    .FirstOrDefaultAsync(pl => pl.PostId == request.PostId && pl.UserId == request.UserId);

                if (existingLike != null)
                {
                    return BadRequest(new { error = "User has already liked this post" });
                }

                // Create new like
                var like = new PostLike
                {
                    PostId = request.PostId,
                    UserId = request.UserId,
                    LikedAt = DateTime.Now
                };

                _context.PostLikes.Add(like);
                await _context.SaveChangesAsync();

                // Get updated count
                var count = await _context.PostLikes
                    .Where(pl => pl.PostId == request.PostId)
                    .CountAsync();

                return Ok(new { success = true, likeCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to like post", details = ex.Message });
            }
        }

        // DELETE: api/likes
        [HttpDelete]
        [AllowAnonymous]
        public async Task<IActionResult> UnlikePost([FromBody] LikeRequest request)
        {
            try
            {
                var like = await _context.PostLikes
                    .FirstOrDefaultAsync(pl => pl.PostId == request.PostId && pl.UserId == request.UserId);

                if (like == null)
                {
                    return NotFound(new { error = "Like not found" });
                }

                _context.PostLikes.Remove(like);
                await _context.SaveChangesAsync();

                // Get updated count
                var count = await _context.PostLikes
                    .Where(pl => pl.PostId == request.PostId)
                    .CountAsync();

                return Ok(new { success = true, likeCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to unlike post", details = ex.Message });
            }
        }
    }

    public class LikeRequest
    {
        public int PostId { get; set; }
        public string UserId { get; set; }
    }
}
