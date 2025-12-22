using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Data;
using SyncSyntax.Models;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/categoriesapi")]
    public class CategoriesApiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesApiController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categoriesapi/check
        [HttpGet("check")]
        [AllowAnonymous]
        public IActionResult Check() => Ok(new { status = "reached" });

        // POST: api/categoriesapi
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var category = new Category
                {
                    Name = model.Name,
                    Description = model.Description
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category created successfully", id = category.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create category", details = ex.Message });
            }
        }

        // GET: api/categoriesapi/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }
            return Ok(category);
        }

        // POST: api/categoriesapi/update/{id}
        [HttpPost("update/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryCreateDto model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound();
                }

                category.Name = model.Name;
                category.Description = model.Description;

                _context.Categories.Update(category);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update category", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Delete(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound();
                }

                // Protect "Uncategorized" - case-insensitive check
                if (category.Name.Trim().Equals("Uncategorized", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { error = "The 'Uncategorized' category is system-protected and cannot be deleted." });
                }

                // Ensure an "Uncategorized" category exists
                var uncategorized = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name.Trim().ToLower() == "uncategorized");

                if (uncategorized == null)
                {
                    uncategorized = new Category { Name = "Uncategorized", Description = "Fallback category for posts." };
                    _context.Categories.Add(uncategorized);
                    await _context.SaveChangesAsync();
                }

                // Safety check: Don't delete "Uncategorized" if found by ID mismatch
                if (category.Id == uncategorized.Id)
                {
                    return BadRequest(new { error = "The 'Uncategorized' category is system-protected and cannot be deleted." });
                }

                // Standard loop for reassignment ensures EF Core tracker is aware of changes
                var postsToReassign = await _context.Posts.Where(p => p.CategoryId == id).ToListAsync();
                foreach (var post in postsToReassign)
                {
                    post.CategoryId = uncategorized.Id;
                }
                
                // Save reassignment first
                await _context.SaveChangesAsync();

                // Now safe to remove the empty category
                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new { success = true, message = $"Category '{category.Name}' deleted. {postsToReassign.Count} posts were moved to 'Uncategorized'." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { 
                    error = "Failed to delete category", 
                    details = ex.Message,
                    innerError = ex.InnerException?.Message 
                });
            }
        }
    }

    public class CategoryCreateDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
    }
}
