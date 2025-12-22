using System;

namespace SyncSyntax.Models
{
    public class NewsletterSubscriber
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public DateTime SubscribedAt { get; set; }
        // Nullable foreign key to AspNetUsers.Id (string). Keeps linkage optional.
        public string? UserId { get; set; }
    }
}
