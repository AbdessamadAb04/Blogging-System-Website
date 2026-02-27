using Microsoft.AspNetCore.Mvc;
using SyncSyntax.Data;
using SyncSyntax.Services;
using MongoDB.Driver;
using MongoDB.Bson;

namespace SyncSyntax.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MongoTestController : ControllerBase
    {
        private readonly MongoDbService _mongoService;

        public MongoTestController(MongoDbService mongoService)
        {
            _mongoService = mongoService;
        }

        [HttpGet("connection")]
        public async Task<IActionResult> TestConnection()
        {
            try
            {
                // Test the connection by pinging the database
                var database = _mongoService.Database;
                var ping = new BsonDocument("ping", 1);
                await database.RunCommandAsync<BsonDocument>(ping);

                return Ok(new { 
                    status = "Connected successfully", 
                    database = database.DatabaseNamespace.DatabaseName 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    status = "Connection failed", 
                    error = ex.Message 
                });
            }
        }

        [HttpPost("ensure-collections")]
        public async Task<IActionResult> EnsureCollectionsExist()
        {
            try
            {
                var repo = HttpContext.RequestServices.GetRequiredService<MongoRepository>();
                await repo.InitializeCollectionsAsync();
                return Ok(new { status = "Collections ensured", database = _mongoService.Database.DatabaseNamespace.DatabaseName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "Failed to ensure collections", error = ex.Message });
            }
        }

        [HttpGet("collections")]
        public async Task<IActionResult> ListCollections()
        {
            try
            {
                var database = _mongoService.Database;
                var collections = await database.ListCollectionNamesAsync();
                var collectionList = await collections.ToListAsync();

                return Ok(new { 
                    database = database.DatabaseNamespace.DatabaseName,
                    collections = collectionList 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    status = "Failed to list collections", 
                    error = ex.Message 
                });
            }
        }

        [HttpPost("create-comprehensive-data")]
        public async Task<IActionResult> CreateComprehensiveTestData()
        {
            try
            {
                var database = _mongoService.Database;

                // Create Authors
                var authorsCollection = database.GetCollection<BsonDocument>("authors");
                var author1 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "fullName", "John Doe" },
                    { "description", "Senior tech writer and developer" },
                    { "joinedAt", DateTime.UtcNow },
                    { "avatarUrl", "https://via.placeholder.com/150" },
                    { "postCount", 0 },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                var author2 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "fullName", "Jane Smith" },
                    { "description", "Frontend developer and UI/UX enthusiast" },
                    { "joinedAt", DateTime.UtcNow },
                    { "avatarUrl", "https://via.placeholder.com/150" },
                    { "postCount", 0 },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                await authorsCollection.InsertManyAsync(new[] { author1, author2 });

                // Create Categories
                var categoriesCollection = database.GetCollection<BsonDocument>("categories");
                var techCategory = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "name", "Technology" },
                    { "description", "Latest trends in technology and development" },
                    { "postCount", 0 },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                var webCategory = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "name", "Web Development" },
                    { "description", "Frontend and backend web development topics" },
                    { "postCount", 0 },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                await categoriesCollection.InsertManyAsync(new[] { techCategory, webCategory });

                // Create Posts
                var postsCollection = database.GetCollection<BsonDocument>("posts");
                var post1 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "title", "Introduction to MongoDB with .NET" },
                    { "subtitle", "Learn how to integrate MongoDB with your .NET applications" },
                    { "content", "MongoDB is a powerful NoSQL database that works great with .NET applications. In this post, we'll explore how to set up and use MongoDB in your projects..." },
                    { "featureImagePath", "https://via.placeholder.com/800x400" },
                    { "publishedDate", DateTime.UtcNow },
                    { "categoryId", techCategory["_id"].AsObjectId.ToString() },
                    { "authorId", author1["_id"].AsObjectId.ToString() },
                    { "status", "Published" },
                    { "likeCount", 0 },
                    { "likedByUsers", new BsonArray() },
                    { "comments", new BsonArray() },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                var post2 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "title", "Building Modern Web Applications" },
                    { "subtitle", "Best practices for frontend development" },
                    { "content", "Modern web applications require a solid architecture and good development practices. Here's what you need to know..." },
                    { "featureImagePath", "https://via.placeholder.com/800x400" },
                    { "publishedDate", DateTime.UtcNow },
                    { "categoryId", webCategory["_id"].AsObjectId.ToString() },
                    { "authorId", author2["_id"].AsObjectId.ToString() },
                    { "status", "Published" },
                    { "likeCount", 5 },
                    { "likedByUsers", new BsonArray { "user1", "user2", "user3", "user4", "user5" } },
                    { "comments", new BsonArray
                        {
                            new BsonDocument
                            {
                                { "_id", ObjectId.GenerateNewId() },
                                { "userName", "Tech Enthusiast" },
                                { "content", "Great article! Very informative." },
                                { "commentDate", DateTime.UtcNow },
                                { "userId", "user1" },
                                { "createdAt", DateTime.UtcNow },
                                { "updatedAt", DateTime.UtcNow }
                            }
                        }
                    },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                await postsCollection.InsertManyAsync(new[] { post1, post2 });

                // Create standalone Comments
                var standaloneCommentsCollection = database.GetCollection<BsonDocument>("comments");
                var comment1 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "userName", "Tech Enthusiast" },
                    { "content", "Great article! Very informative." },
                    { "commentDate", DateTime.UtcNow },
                    { "postId", post2["_id"].AsObjectId.ToString() },
                    { "userId", "user1" },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };
                await standaloneCommentsCollection.InsertOneAsync(comment1);

                // Update Post with the created standalone comment reference (already embedded, but keeping link)
                // In a real scenario, we might want to use the same ID.
                var embeddedComment = post2["comments"].AsBsonArray[0].AsBsonDocument;
                embeddedComment["_id"] = comment1["_id"]; 
                await postsCollection.ReplaceOneAsync(Builders<BsonDocument>.Filter.Eq("_id", post2["_id"]), post2);

                // Create standalone PostLikes
                var postLikesCollection = database.GetCollection<BsonDocument>("postLikes");
                var like1 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "postId", post2["_id"].AsObjectId.ToString() },
                    { "userId", "user1" },
                    { "likedAt", DateTime.UtcNow }
                };
                await postLikesCollection.InsertOneAsync(like1);

                // Create Users
                var usersCollection = database.GetCollection<BsonDocument>("users");
                var user1 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "userName", "admin" },
                    { "normalizedUserName", "ADMIN" },
                    { "email", "admin@example.com" },
                    { "normalizedEmail", "ADMIN@EXAMPLE.COM" },
                    { "emailConfirmed", true },
                    { "passwordHash", "hashed_password_here" },
                    { "securityStamp", Guid.NewGuid().ToString() },
                    { "concurrencyStamp", Guid.NewGuid().ToString() },
                    { "fullName", "Administrator" },
                    { "role", "Admin" },
                    { "registrationDate", DateTime.UtcNow },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                var user2 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "userName", "abdessamadstuff@gmail.com" },
                    { "normalizedUserName", "ABDESSAMADSTUFF@GMAIL.COM" },
                    { "email", "abdessamadstuff@gmail.com" },
                    { "normalizedEmail", "ABDESSAMADSTUFF@GMAIL.COM" },
                    { "emailConfirmed", true },
                    { "passwordHash", "abdessamad2004" },
                    { "securityStamp", Guid.NewGuid().ToString() },
                    { "concurrencyStamp", Guid.NewGuid().ToString() },
                    { "fullName", "Abdessamad" },
                    { "role", "Admin" },
                    { "registrationDate", DateTime.UtcNow },
                    { "createdAt", DateTime.UtcNow },
                    { "updatedAt", DateTime.UtcNow }
                };

                await usersCollection.InsertManyAsync(new[] { user1, user2 });

                // Create Newsletter Subscribers
                var newsletterCollection = database.GetCollection<BsonDocument>("newsletterSubscribers");
                var subscriber1 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "email", "subscriber1@example.com" },
                    { "subscribedAt", DateTime.UtcNow },
                    { "isActive", true }
                };

                var subscriber2 = new BsonDocument
                {
                    { "_id", ObjectId.GenerateNewId() },
                    { "email", "subscriber2@example.com" },
                    { "subscribedAt", DateTime.UtcNow },
                    { "isActive", true }
                };

                await newsletterCollection.InsertManyAsync(new[] { subscriber1, subscriber2 });

                // Update category post counts
                await categoriesCollection.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", techCategory["_id"]),
                    Builders<BsonDocument>.Update.Set("postCount", 1));

                await categoriesCollection.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", webCategory["_id"]),
                    Builders<BsonDocument>.Update.Set("postCount", 1));

                // Update author post counts  
                await authorsCollection.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", author1["_id"]),
                    Builders<BsonDocument>.Update.Set("postCount", 1));

                await authorsCollection.UpdateOneAsync(
                    Builders<BsonDocument>.Filter.Eq("_id", author2["_id"]),
                    Builders<BsonDocument>.Update.Set("postCount", 1));

                return Ok(new { 
                    status = "Comprehensive test data created successfully",
                    database = database.DatabaseNamespace.DatabaseName,
                    collectionsCreated = new[] { 
                        "authors", "categories", "posts", "users", "newsletterSubscribers" 
                    },
                    summary = new {
                        authors = 2,
                        categories = 2,
                        posts = 2,
                        users = 1,
                        newsletterSubscribers = 2,
                        comments = 1,
                        likes = 5
                    },
                    message = "You should now see all collections with sample data in MongoDB"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    status = "Failed to create comprehensive test data", 
                    error = ex.Message 
                });
            }
        }
    }
}