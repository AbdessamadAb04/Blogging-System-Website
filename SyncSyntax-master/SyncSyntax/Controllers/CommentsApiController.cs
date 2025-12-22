using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;
using SyncSyntax.Models;
using System.Security.Claims;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/comments")]
    public class CommentsApiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentsApiController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/comments/{postId}
        [HttpGet("{postId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetComments(int postId)
        {
            try
            {
                var comments = await _context.Comments
                    .Include(c => c.User)
                    .Where(c => c.PostId == postId)
                    .OrderByDescending(c => c.CommentDate)
                    .Select(c => new
                    {
                        id = c.Id,
                        userName = !string.IsNullOrEmpty(c.User.FullName) ? c.User.FullName : c.UserName,
                        userId = c.UserId,
                        content = c.Content,
                        commentDate = c.CommentDate.ToString("MMMM dd, yyyy"),
                        timestamp = c.CommentDate
                    })
                    .ToListAsync();

                return Ok(comments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve comments", details = ex.Message });
            }
        }

        // POST: api/comments
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddComment([FromBody] CommentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return BadRequest(new { error = "Comment content is required" });
                }

                var postExists = await _context.Posts.AnyAsync(p => p.Id == request.PostId);
                if (!postExists)
                {
                    return NotFound(new { error = "Post not found" });
                }

                // Get current user email/username from claims
                var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.Name);
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new { error = "User identity not found" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                if (user == null)
                {
                    return Unauthorized(new { error = "User not found in database" });
                }

                var comment = new Comment
                {
                    PostId = request.PostId,
                    Content = request.Content,
                    UserId = user.Id,
                    UserName = user.UserName ?? userEmail,
                    CommentDate = DateTime.Now
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = comment.Id,
                    userName = !string.IsNullOrEmpty(user.FullName) ? user.FullName : comment.UserName,
                    userId = comment.UserId,
                    content = comment.Content,
                    commentDate = comment.CommentDate.ToString("MMMM dd, yyyy"),
                    timestamp = comment.CommentDate
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add comment", details = ex.Message });
            }
        }

        // DELETE: api/comments/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int id)
        {
            try
            {
                var comment = await _context.Comments.FindAsync(id);
                if (comment == null)
                {
                    return NotFound(new { error = "Comment not found" });
                }

                // Check if user is owner or Admin
                var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.Name);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
                
                bool isOwner = user != null && comment.UserId == user.Id;
                bool isAdmin = User.IsInRole("Admin");

                if (!isOwner && !isAdmin)
                {
                    return Forbid();
                }

                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Comment deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete comment", details = ex.Message });
            }
        }
    }

    public class CommentRequest
    {
        public int PostId { get; set; }
        public string Content { get; set; }
    }
}
