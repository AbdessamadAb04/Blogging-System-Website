using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SyncSyntax.Models.MongoDB
{
    public class MongoNewsletterSubscriber
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("email")]
        public string Email { get; set; }

        [BsonElement("subscribedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("userId")]
        public string? UserId { get; set; }

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}