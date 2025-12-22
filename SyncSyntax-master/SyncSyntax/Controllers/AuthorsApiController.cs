using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;
using SyncSyntax.Models;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/authorsapi")]
    public class AuthorsApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public AuthorsApiController(AppDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        // GET: api/authorsapi
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            try
            {
                var authors = await _context.Authors
                    .AsNoTracking()
                    .Select(a => new
                    {
                        id = a.Id,
                        fullName = a.FullName,
                        description = a.Description,
                        joinedAt = a.JoinedAt,
                        avatarUrl = a.AvatarUrl,
                        postCount = _context.Posts.Count(p => p.AuthorId == a.Id),
                        posts = _context.Posts
                            .Where(p => p.AuthorId == a.Id)
                            .OrderByDescending(p => p.PublishedDate)
                            .Select(p => new
                            {
                                id = p.Id,
                                title = p.Title,
                                publishedDate = p.PublishedDate,
                                status = p.Status,
                                category = p.Category != null ? new { id = p.Category.Id, name = p.Category.Name } : null
                            })
                            .ToList()
                    })
                    .ToListAsync();

                return Ok(authors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve authors", details = ex.Message });
            }
        }
        // POST: api/authorsapi
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromForm] AuthorCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                string avatarUrl = null;
                if (model.Avatar != null)
                {
                    avatarUrl = await UploadFileToFolder(model.Avatar);
                }

                var author = new Author
                {
                    FullName = model.FullName,
                    Description = model.Description,
                    JoinedAt = DateTime.Now,
                    AvatarUrl = avatarUrl
                };

                _context.Authors.Add(author);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Author created successfully", id = author.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create author", details = ex.Message });
            }
        }

        // GET: api/authorsapi/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var author = await _context.Authors
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id);

            if (author == null)
            {
                return NotFound();
            }

            return Ok(author);
        }

        // POST: api/authorsapi/update/{id}
        [HttpPost("update/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Update(int id, [FromForm] AuthorUpdateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var author = await _context.Authors.FindAsync(id);
                if (author == null)
                {
                    return NotFound();
                }

                author.FullName = model.FullName;
                author.Description = model.Description;

                if (model.Avatar != null)
                {
                    author.AvatarUrl = await UploadFileToFolder(model.Avatar);
                }

                _context.Authors.Update(author);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Author updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update author", details = ex.Message });
            }
        }

        // DELETE: api/authorsapi/{id}
        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Delete(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var author = await _context.Authors.FindAsync(id);
                if (author == null)
                {
                    return NotFound();
                }

                // Reassign all posts to null (Staff Writer fallback)
                var posts = await _context.Posts.Where(p => p.AuthorId == id).ToListAsync();
                foreach (var post in posts)
                {
                    post.AuthorId = null;
                }
                await _context.SaveChangesAsync();

                _context.Authors.Remove(author);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new { success = true, message = $"Author '{author.FullName}' deleted. {posts.Count} posts reassigned to Staff Writer." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { error = "Failed to delete author", details = ex.Message });
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

    public class AuthorCreateDto
    {
        public string FullName { get; set; }
        public string UserName { get; set; }
        public string? Description { get; set; }
        public IFormFile? Avatar { get; set; }
    }

    public class AuthorUpdateDto
    {
        public string FullName { get; set; }
        public string? Description { get; set; }
        public IFormFile? Avatar { get; set; }
    }
}
