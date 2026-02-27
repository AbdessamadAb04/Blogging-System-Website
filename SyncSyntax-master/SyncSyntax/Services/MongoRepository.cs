using MongoDB.Driver;
using MongoDB.Bson;
using SyncSyntax.Models.MongoDB;
using SyncSyntax.Models;
using SyncSyntax.Data;

namespace SyncSyntax.Services
{
    public class MongoRepository
    {
        private readonly IMongoDatabase _database;

        public MongoRepository(MongoDbService mongoDbService)
        {
            _database = mongoDbService.Database;
        }

        public async Task InitializeCollectionsAsync()
        {
            var collectionNames = new[] { "posts", "categories", "authors", "comments", "postLikes", "newsletterSubscribers", "users" };
            var existingCollections = await (await _database.ListCollectionNamesAsync()).ToListAsync();

            foreach (var name in collectionNames)
            {
                if (!existingCollections.Contains(name))
                {
                    await _database.CreateCollectionAsync(name);
                }
            }
        }

        // Collections
        public IMongoCollection<MongoPost> Posts => _database.GetCollection<MongoPost>("posts");
        public IMongoCollection<MongoCategory> Categories => _database.GetCollection<MongoCategory>("categories");
        public IMongoCollection<MongoAuthor> Authors => _database.GetCollection<MongoAuthor>("authors");
        public IMongoCollection<MongoComment> Comments => _database.GetCollection<MongoComment>("comments");
        public IMongoCollection<MongoPostLike> PostLikes => _database.GetCollection<MongoPostLike>("postLikes");
        public IMongoCollection<MongoNewsletterSubscriber> NewsletterSubscribers => _database.GetCollection<MongoNewsletterSubscriber>("newsletterSubscribers");
        public IMongoCollection<MongoApplicationUser> Users => _database.GetCollection<MongoApplicationUser>("users");

        // Generic CRUD operations
        public async Task<T> CreateAsync<T>(IMongoCollection<T> collection, T entity)
        {
            await collection.InsertOneAsync(entity);
            return entity;
        }

        public async Task<T> GetByIdAsync<T>(IMongoCollection<T> collection, string id)
        {
            return await collection.Find(Builders<T>.Filter.Eq("_id", ObjectId.Parse(id))).FirstOrDefaultAsync();
        }

        public async Task<List<T>> GetAllAsync<T>(IMongoCollection<T> collection)
        {
            return await collection.Find(_ => true).ToListAsync();
        }

        public async Task<bool> UpdateAsync<T>(IMongoCollection<T> collection, string id, T entity)
        {
            var result = await collection.ReplaceOneAsync(
                Builders<T>.Filter.Eq("_id", ObjectId.Parse(id)), entity);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteAsync<T>(IMongoCollection<T> collection, string id)
        {
            var result = await collection.DeleteOneAsync(
                Builders<T>.Filter.Eq("_id", ObjectId.Parse(id)));
            return result.DeletedCount > 0;
        }

        // Specific operations for Posts
        public async Task<List<MongoPost>> GetPostsByCategoryAsync(string categoryId)
        {
            return await Posts.Find(p => p.CategoryId == categoryId).ToListAsync();
        }

        public async Task<List<MongoPost>> GetPostsByAuthorAsync(string authorId)
        {
            return await Posts.Find(p => p.AuthorId == authorId).ToListAsync();
        }

        public async Task<List<MongoPost>> GetPublishedPostsAsync()
        {
            return await Posts.Find(p => p.Status == "Published").ToListAsync();
        }

        public async Task<MongoPost> ToggleLikeAsync(string postId, string userId)
        {
            var post = await GetByIdAsync(Posts, postId);
            if (post == null) return null;

            if (post.LikedByUsers.Contains(userId))
            {
                // Unlike
                post.LikedByUsers.Remove(userId);
                post.LikeCount = Math.Max(0, post.LikeCount - 1);
            }
            else
            {
                // Like
                post.LikedByUsers.Add(userId);
                post.LikeCount++;
            }

            post.UpdatedAt = DateTime.UtcNow;
            await UpdateAsync(Posts, postId, post);
            return post;
        }

        public async Task<MongoPost> AddCommentToPostAsync(string postId, MongoComment comment)
        {
            var post = await GetByIdAsync(Posts, postId);
            if (post == null) return null;

            comment.Id = ObjectId.GenerateNewId().ToString();
            comment.PostId = postId;
            comment.CreatedAt = DateTime.UtcNow;
            comment.UpdatedAt = DateTime.UtcNow;

            post.Comments.Add(comment);
            post.UpdatedAt = DateTime.UtcNow;

            await UpdateAsync(Posts, postId, post);
            return post;
        }

        // Specific operations for Categories
        public async Task<MongoCategory> UpdateCategoryPostCountAsync(string categoryId)
        {
            var category = await GetByIdAsync(Categories, categoryId);
            if (category == null) return null;

            var postCount = await Posts.CountDocumentsAsync(p => p.CategoryId == categoryId);
            category.PostCount = (int)postCount;
            category.UpdatedAt = DateTime.UtcNow;

            await UpdateAsync(Categories, categoryId, category);
            return category;
        }

        // Specific operations for Authors
        public async Task<MongoAuthor> UpdateAuthorPostCountAsync(string authorId)
        {
            var author = await GetByIdAsync(Authors, authorId);
            if (author == null) return null;

            var postCount = await Posts.CountDocumentsAsync(p => p.AuthorId == authorId);
            author.PostCount = (int)postCount;
            author.UpdatedAt = DateTime.UtcNow;

            await UpdateAsync(Authors, authorId, author);
            return author;
        }

        // Search operations
        public async Task<List<MongoPost>> SearchPostsAsync(string searchTerm)
        {
            var filter = Builders<MongoPost>.Filter.Or(
                Builders<MongoPost>.Filter.Regex(p => p.Title, new BsonRegularExpression(searchTerm, "i")),
                Builders<MongoPost>.Filter.Regex(p => p.Content, new BsonRegularExpression(searchTerm, "i"))
            );

            return await Posts.Find(filter).ToListAsync();
        }

        public async Task<List<MongoCategory>> SearchCategoriesAsync(string searchTerm)
        {
            var filter = Builders<MongoCategory>.Filter.Regex(c => c.Name, new BsonRegularExpression(searchTerm, "i"));
            return await Categories.Find(filter).ToListAsync();
        }

        // Migration helpers - convert from EF models to MongoDB models
        public MongoPost ConvertToMongoPost(Post efPost)
        {
            return new MongoPost
            {
                Title = efPost.Title,
                Subtitle = efPost.Subtitle,
                Content = efPost.Content,
                FeatureImagePath = efPost.FeatureImagePath ?? "",
                PublishedDate = DateTime.SpecifyKind(efPost.PublishedDate, DateTimeKind.Utc),
                CategoryId = efPost.CategoryId.ToString(),
                AuthorId = efPost.AuthorId?.ToString(),
                Status = efPost.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public MongoCategory ConvertToMongoCategory(Category efCategory)
        {
            return new MongoCategory
            {
                Name = efCategory.Name,
                Description = efCategory.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public MongoAuthor ConvertToMongoAuthor(Author efAuthor)
        {
            return new MongoAuthor
            {
                FullName = efAuthor.FullName,
                Description = efAuthor.Description,
                JoinedAt = DateTime.SpecifyKind(efAuthor.JoinedAt, DateTimeKind.Utc),
                AvatarUrl = efAuthor.AvatarUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}