using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace SyncSyntax.Models.MongoDB
{
    public class MongoApplicationUser
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userName")]
        public string UserName { get; set; }

        [BsonElement("normalizedUserName")]
        public string NormalizedUserName { get; set; }

        [BsonElement("email")]
        public string Email { get; set; }

        [BsonElement("normalizedEmail")]
        public string NormalizedEmail { get; set; }

        [BsonElement("emailConfirmed")]
        public bool EmailConfirmed { get; set; } = false;

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; }

        [BsonElement("securityStamp")]
        public string SecurityStamp { get; set; }

        [BsonElement("concurrencyStamp")]
        public string ConcurrencyStamp { get; set; }

        [BsonElement("phoneNumber")]
        public string? PhoneNumber { get; set; }

        [BsonElement("phoneNumberConfirmed")]
        public bool PhoneNumberConfirmed { get; set; } = false;

        [BsonElement("twoFactorEnabled")]
        public bool TwoFactorEnabled { get; set; } = false;

        [BsonElement("lockoutEnd")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? LockoutEnd { get; set; }

        [BsonElement("lockoutEnabled")]
        public bool LockoutEnabled { get; set; } = false;

        [BsonElement("accessFailedCount")]
        public int AccessFailedCount { get; set; } = 0;

        [BsonElement("registrationDate")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

        [MaxLength(256)]
        [BsonElement("fullName")]
        public string? FullName { get; set; }

        [MaxLength(256)]
        [BsonElement("role")]
        public string? Role { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}