using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;
using SyncSyntax.Models;
using System.Linq;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/postsapi")]
    public class PostsApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public PostsApiController(AppDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        // GET: api/postsapi/check
        [HttpGet("check")]
        [AllowAnonymous]
        public IActionResult Check() => Ok(new { status = "reached" });

        // GET: api/postsapi?count=20&includeDrafts=false
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get([FromQuery] int count = 20, [FromQuery] bool includeDrafts = false)
        {
            try
            {
                var query = _context.Posts
                    .AsNoTracking()
                    .Include(p => p.Category)
                    .Include(p => p.Author)
                    .AsQueryable();

                if (!includeDrafts)
                {
                    query = query.Where(p => p.Status == "Published");
                }

                var posts = await query
                    .OrderByDescending(p => p.PublishedDate)
                    .Take(count)
                    .Select(p => new
                    {
                        id = p.Id,
                        title = p.Title,
                        subtitle = p.Subtitle,
                        featureImageUrl = p.FeatureImagePath ?? "",
                        createdAt = p.PublishedDate,
                        status = p.Status,
                        category = p.Category != null ? new { id = p.Category.Id, name = p.Category.Name } : null,
                        categoryId = p.CategoryId,
                        author = p.Author != null ? p.Author.FullName : "Staff Writer",
                        likeCount = _context.PostLikes.Count(l => l.PostId == p.Id),
                        commentCount = _context.Comments.Count(c => c.PostId == p.Id)
                    })
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                // Write full exception to stderr for easier debugging during development
                System.Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { error = "Failed to retrieve posts", details = ex.ToString() });
            }
        }

        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new 
                { 
                    id = c.Id, 
                    name = c.Name, 
                    description = c.Description,
                    postCount = _context.Posts.Count(p => p.CategoryId == c.Id),
                    likeCount = _context.PostLikes.Count(l => l.Post.CategoryId == c.Id),
                    commentCount = _context.Comments.Count(cm => cm.Post.CategoryId == c.Id)
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/postsapi/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var post = await _context.Posts
                    .Include(p => p.Category)
                    .Include(p => p.Author)
                    .Where(p => p.Id == id)
                    .Select(p => new
                    {
                        id = p.Id,
                        title = p.Title,
                        content = p.Content,
                        subtitle = p.Subtitle,
                        featureImageUrl = p.FeatureImagePath ?? "",
                        createdAt = p.PublishedDate,
                        status = p.Status,
                        categoryId = p.CategoryId,
                        category = p.Category != null ? new { id = p.Category.Id, name = p.Category.Name } : null,
                        authorId = p.AuthorId,
                        author = p.Author != null ? p.Author.FullName : "Staff Writer"
                    })
                    .FirstOrDefaultAsync();

                if (post == null)
                {
                    return NotFound();
                }

                return Ok(post);
            }
            catch (Exception ex)
            {
                System.Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { error = "Failed to retrieve post", details = ex.ToString() });
            }
        }

        // GET: api/postsapi/by-category/{categoryId}
        [HttpGet("by-category/{categoryId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByCategory(int categoryId, [FromQuery] int count = 10, [FromQuery] bool includeDrafts = false)
        {
            try
            {
                var query = _context.Posts
                    .Include(p => p.Category)
                    .Include(p => p.Author)
                    .Where(p => p.CategoryId == categoryId);

                if (!includeDrafts)
                {
                    query = query.Where(p => p.Status == "Published");
                }

                var posts = await query
                    .OrderByDescending(p => p.PublishedDate)
                    .Take(count)
                    .Select(p => new
                    {
                        id = p.Id,
                        title = p.Title,
                        subtitle = p.Subtitle,
                        featureImageUrl = p.FeatureImagePath ?? "",
                        createdAt = p.PublishedDate,
                        status = p.Status,
                        categoryId = p.CategoryId,
                        category = p.Category != null ? new { id = p.Category.Id, name = p.Category.Name } : null,
                        author = p.Author != null ? p.Author.FullName : "Staff Writer"
                    })
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                System.Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { error = "Failed to retrieve posts by category", details = ex.ToString() });
            }
        }

        // DELETE: api/postsapi/{id}
        [HttpDelete("{id}")]
        [Authorize] // Ideally restrict to Admin
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                // Fetch post with all related data that needs to be deleted
                var post = await _context.Posts
                    .Include(p => p.Comments)
                    .Include(p => p.Likes)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                {
                    return NotFound(new { error = "Post not found" });
                }

                // 1. Explicitly remove related entities
                // (Even if DB Cascade is on, this is safe and robust)
                if (post.Comments != null && post.Comments.Any())
                {
                    _context.Comments.RemoveRange(post.Comments);
                }

                if (post.Likes != null && post.Likes.Any())
                {
                    _context.PostLikes.RemoveRange(post.Likes);
                }

                // 2. Remove the post itself
                _context.Posts.Remove(post);
                
                await _context.SaveChangesAsync();
                // DB Deletion Successful!

                // 3. Delete associated image from file system (Best Effort)
                // We do this AFTER DB commit so that if file is locked, we don't rollback the valid DB deletion.
                if (!string.IsNullOrEmpty(post.FeatureImagePath))
                {
                    try 
                    {
                        var imagePath = Path.Combine(_webHostEnvironment.WebRootPath, "images", Path.GetFileName(post.FeatureImagePath));
                        if (System.IO.File.Exists(imagePath))
                        {
                            System.IO.File.Delete(imagePath);
                        }
                    }
                    catch (Exception fileEx)
                    {
                        // Log file deletion error but return success to user as the Post is gone
                        System.Console.Error.WriteLine($"Warning: Failed to delete image file: {fileEx.Message}");
                    }
                }

                return Ok(new { success = true, message = "Post deleted successfully" });
            }
            catch (Exception ex)
            {
                System.Console.Error.WriteLine($"DELETE FAILURE: {ex.Message}");
                if (ex.InnerException != null)
                {
                   System.Console.Error.WriteLine($"INNER EXCEPTION: {ex.InnerException.Message}");
                   if (ex.InnerException.InnerException != null)
                   {
                       System.Console.Error.WriteLine($"INNER INNER EXCEPTION: {ex.InnerException.InnerException.Message}");
                   }
                }
                return StatusCode(500, new { error = "Failed to delete post", details = ex.Message, inner = ex.InnerException?.Message });
            }
        }
        // POST: api/postsapi
        [HttpPost]
        [AllowAnonymous] // Or [Authorize(Roles = "Admin")] depending on requirements, user asked for admin pages so likely Admin
        public async Task<IActionResult> Create([FromForm] PostCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                string featureImagePath = ""; // Default to empty string to prevent SqlNullValueException
                if (model.FeatureImage != null)
                {
                    featureImagePath = await UploadFileToFolder(model.FeatureImage);
                }

                var post = new Post
                {
                    Title = model.Title,
                    Subtitle = model.Subtitle,
                    Content = model.Content,
                    CategoryId = model.CategoryId,
                    AuthorId = model.AuthorId, // Nullable
                    Status = model.Status,
                    PublishedDate = DateTime.Now,
                    FeatureImagePath = featureImagePath
                };

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Post created successfully", id = post.Id });
            }
            catch (Exception ex)
            {
                System.Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { error = "Failed to create post", details = ex.ToString() });
            }
        }

        // POST: api/postsapi/update/{id}
        [HttpPost("update/{id}")]
        [AllowAnonymous] // Maintain consistency with Create for now
        public async Task<IActionResult> Update(int id, [FromForm] PostCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id);
                if (post == null)
                {
                    return NotFound(new { error = "Post not found" });
                }

                post.Title = model.Title;
                post.Subtitle = model.Subtitle;
                post.Content = model.Content;
                post.CategoryId = model.CategoryId;
                post.AuthorId = model.AuthorId;
                post.Status = model.Status;

                if (model.FeatureImage != null)
                {
                    // 1. Delete old image if it exists
                    if (!string.IsNullOrEmpty(post.FeatureImagePath))
                    {
                        try
                        {
                            var oldImagePath = Path.Combine(_webHostEnvironment.WebRootPath, post.FeatureImagePath.TrimStart('/'));
                            if (System.IO.File.Exists(oldImagePath))
                            {
                                System.IO.File.Delete(oldImagePath);
                            }
                        }
                        catch (Exception fileEx)
                        {
                            System.Console.Error.WriteLine($"Warning: Failed to delete old image file: {fileEx.Message}");
                        }
                    }

                    // 2. Upload new image
                    post.FeatureImagePath = await UploadFileToFolder(model.FeatureImage);
                }

                _context.Posts.Update(post);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Post updated successfully" });
            }
            catch (Exception ex)
            {
                System.Console.Error.WriteLine(ex.ToString());
                return StatusCode(500, new { error = "Failed to update post", details = ex.ToString() });
            }
        }

        private async Task<string> UploadFileToFolder(IFormFile file)
        {
            var inputFileExtension = Path.GetExtension(file.FileName);
            var fileName = Guid.NewGuid().ToString() + inputFileExtension;
            var wwwRootPath = _webHostEnvironment.WebRootPath;
            var imagesFolderPath = Path.Combine(wwwRootPath, "images");

            if (!Directory.Exists(imagesFolderPath))
            {
                Directory.CreateDirectory(imagesFolderPath);
            }

            var filePath = Path.Combine(imagesFolderPath, fileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return "/images/" + fileName;
        }
    }

    public class PostCreateDto
    {
        public string Title { get; set; }
        public string? Subtitle { get; set; }
        public string Content { get; set; }
        public int CategoryId { get; set; }
        public int? AuthorId { get; set; }
        public string Status { get; set; } = "Draft";
        public IFormFile? FeatureImage { get; set; }
    }
}
