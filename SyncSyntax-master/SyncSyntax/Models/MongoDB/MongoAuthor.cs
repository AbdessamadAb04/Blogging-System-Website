using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace SyncSyntax.Models.MongoDB
{
    public class MongoAuthor
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters.")]
        [BsonElement("fullName")]
        public string FullName { get; set; }

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("joinedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("avatarUrl")]
        public string? AvatarUrl { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Statistics for better performance
        [BsonElement("postCount")]
        public int PostCount { get; set; } = 0;
    }
}