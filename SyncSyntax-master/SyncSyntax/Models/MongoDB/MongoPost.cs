using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace SyncSyntax.Models.MongoDB
{
    public class MongoPost
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required(ErrorMessage = "The title is required.")]
        [MaxLength(200, ErrorMessage = "The title cannot exceed 200 characters.")]
        [BsonElement("title")]
        public string Title { get; set; }

        [MaxLength(500, ErrorMessage = "The subtitle cannot exceed 500 characters.")]
        [BsonElement("subtitle")]
        public string? Subtitle { get; set; }

        [Required(ErrorMessage = "Content is required.")]
        [BsonElement("content")]
        public string Content { get; set; }

        [BsonElement("featureImagePath")]
        public string FeatureImagePath { get; set; } = "";

        [BsonElement("publishedDate")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime PublishedDate { get; set; } = DateTime.UtcNow;

        [BsonElement("categoryId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string CategoryId { get; set; }

        [BsonElement("authorId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? AuthorId { get; set; }

        [Required]
        [MaxLength(20)]
        [BsonElement("status")]
        public string Status { get; set; } = "Draft";

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Embedded comments for better performance
        [BsonElement("comments")]
        public List<MongoComment> Comments { get; set; } = new List<MongoComment>();

        // Like count for better performance
        [BsonElement("likeCount")]
        public int LikeCount { get; set; } = 0;

        // Array of user IDs who liked this post
        [BsonElement("likedByUsers")]
        public List<string> LikedByUsers { get; set; } = new List<string>();
    }
}