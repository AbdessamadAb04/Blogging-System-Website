using Microsoft.AspNetCore.Mvc;
using SyncSyntax.Models.MongoDB;
using SyncSyntax.Services;
using MongoDB.Bson;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MongoDataController : ControllerBase
    {
        private readonly MongoRepository _mongoRepo;

        public MongoDataController(MongoRepository mongoRepo)
        {
            _mongoRepo = mongoRepo;
        }

        // Posts endpoints
        [HttpGet("posts")]
        public async Task<IActionResult> GetAllPosts()
        {
            try
            {
                var posts = await _mongoRepo.GetAllAsync(_mongoRepo.Posts);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("posts/{id}")]
        public async Task<IActionResult> GetPostById(string id)
        {
            try
            {
                var post = await _mongoRepo.GetByIdAsync(_mongoRepo.Posts, id);
                if (post == null) return NotFound();
                return Ok(post);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("posts/published")]
        public async Task<IActionResult> GetPublishedPosts()
        {
            try
            {
                var posts = await _mongoRepo.GetPublishedPostsAsync();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("posts/category/{categoryId}")]
        public async Task<IActionResult> GetPostsByCategory(string categoryId)
        {
            try
            {
                var posts = await _mongoRepo.GetPostsByCategoryAsync(categoryId);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("posts")]
        public async Task<IActionResult> CreatePost([FromBody] MongoPost post)
        {
            try
            {
                var createdPost = await _mongoRepo.CreateAsync(_mongoRepo.Posts, post);
                
                // Update category post count
                if (!string.IsNullOrEmpty(post.CategoryId))
                {
                    await _mongoRepo.UpdateCategoryPostCountAsync(post.CategoryId);
                }

                return CreatedAtAction(nameof(GetPostById), new { id = createdPost.Id }, createdPost);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("posts/{id}")]
        public async Task<IActionResult> UpdatePost(string id, [FromBody] MongoPost post)
        {
            try
            {
                post.UpdatedAt = DateTime.UtcNow;
                var updated = await _mongoRepo.UpdateAsync(_mongoRepo.Posts, id, post);
                if (!updated) return NotFound();
                return Ok(post);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("posts/{id}")]
        public async Task<IActionResult> DeletePost(string id)
        {
            try
            {
                var deleted = await _mongoRepo.DeleteAsync(_mongoRepo.Posts, id);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/like/{userId}")]
        public async Task<IActionResult> TogglePostLike(string postId, string userId)
        {
            try
            {
                var post = await _mongoRepo.ToggleLikeAsync(postId, userId);
                if (post == null) return NotFound();
                return Ok(new { likeCount = post.LikeCount, liked = post.LikedByUsers.Contains(userId) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/comments")]
        public async Task<IActionResult> AddComment(string postId, [FromBody] MongoComment comment)
        {
            try
            {
                var post = await _mongoRepo.AddCommentToPostAsync(postId, comment);
                if (post == null) return NotFound();
                return Ok(comment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Categories endpoints
        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            try
            {
                var categories = await _mongoRepo.GetAllAsync(_mongoRepo.Categories);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("categories/{id}")]
        public async Task<IActionResult> GetCategoryById(string id)
        {
            try
            {
                var category = await _mongoRepo.GetByIdAsync(_mongoRepo.Categories, id);
                if (category == null) return NotFound();
                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] MongoCategory category)
        {
            try
            {
                var createdCategory = await _mongoRepo.CreateAsync(_mongoRepo.Categories, category);
                return CreatedAtAction(nameof(GetCategoryById), new { id = createdCategory.Id }, createdCategory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(string id, [FromBody] MongoCategory category)
        {
            try
            {
                category.UpdatedAt = DateTime.UtcNow;
                var updated = await _mongoRepo.UpdateAsync(_mongoRepo.Categories, id, category);
                if (!updated) return NotFound();
                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(string id)
        {
            try
            {
                var deleted = await _mongoRepo.DeleteAsync(_mongoRepo.Categories, id);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Authors endpoints
        [HttpGet("authors")]
        public async Task<IActionResult> GetAllAuthors()
        {
            try
            {
                var authors = await _mongoRepo.GetAllAsync(_mongoRepo.Authors);
                return Ok(authors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("authors/{id}")]
        public async Task<IActionResult> GetAuthorById(string id)
        {
            try
            {
                var author = await _mongoRepo.GetByIdAsync(_mongoRepo.Authors, id);
                if (author == null) return NotFound();
                return Ok(author);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("authors")]
        public async Task<IActionResult> CreateAuthor([FromBody] MongoAuthor author)
        {
            try
            {
                var createdAuthor = await _mongoRepo.CreateAsync(_mongoRepo.Authors, author);
                return CreatedAtAction(nameof(GetAuthorById), new { id = createdAuthor.Id }, createdAuthor);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("authors/{id}")]
        public async Task<IActionResult> UpdateAuthor(string id, [FromBody] MongoAuthor author)
        {
            try
            {
                author.UpdatedAt = DateTime.UtcNow;
                var updated = await _mongoRepo.UpdateAsync(_mongoRepo.Authors, id, author);
                if (!updated) return NotFound();
                return Ok(author);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("authors/{id}")]
        public async Task<IActionResult> DeleteAuthor(string id)
        {
            try
            {
                var deleted = await _mongoRepo.DeleteAsync(_mongoRepo.Authors, id);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Newsletter subscribers endpoints
        [HttpGet("newsletter-subscribers")]
        public async Task<IActionResult> GetAllNewsletterSubscribers()
        {
            try
            {
                var subscribers = await _mongoRepo.GetAllAsync(_mongoRepo.NewsletterSubscribers);
                return Ok(subscribers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("newsletter-subscribers")]
        public async Task<IActionResult> CreateNewsletterSubscriber([FromBody] MongoNewsletterSubscriber subscriber)
        {
            try
            {
                var createdSubscriber = await _mongoRepo.CreateAsync(_mongoRepo.NewsletterSubscribers, subscriber);
                return Ok(createdSubscriber);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Search endpoints
        [HttpGet("search/posts")]
        public async Task<IActionResult> SearchPosts([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrEmpty(q)) return BadRequest("Search query is required");
                var posts = await _mongoRepo.SearchPostsAsync(q);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("search/categories")]
        public async Task<IActionResult> SearchCategories([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrEmpty(q)) return BadRequest("Search query is required");
                var categories = await _mongoRepo.SearchCategoriesAsync(q);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}