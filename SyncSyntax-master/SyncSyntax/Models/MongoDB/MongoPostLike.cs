using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace SyncSyntax.Models.MongoDB
{
    public class MongoPostLike
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [Required]
        [BsonElement("postId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PostId { get; set; }

        [Required]
        [BsonElement("userId")]
        public string UserId { get; set; }

        [Required]
        [BsonElement("likedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime LikedAt { get; set; } = DateTime.UtcNow;
    }
}