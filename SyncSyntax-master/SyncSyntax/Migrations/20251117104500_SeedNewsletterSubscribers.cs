using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    public partial class SeedNewsletterSubscribers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insert a few sample newsletter subscribers. UserId left NULL so no user rows are modified.
            migrationBuilder.Sql("INSERT INTO [NewsletterSubscribers] (Email, SubscribedAt, UserId) VALUES ('alice@example.com', '2025-11-01T09:00:00', NULL)");
            migrationBuilder.Sql("INSERT INTO [NewsletterSubscribers] (Email, SubscribedAt, UserId) VALUES ('bob@example.com', '2025-10-20T14:30:00', NULL)");
            migrationBuilder.Sql("INSERT INTO [NewsletterSubscribers] (Email, SubscribedAt, UserId) VALUES ('carol@example.com', '2025-11-10T18:45:00', NULL)");
            migrationBuilder.Sql("INSERT INTO [NewsletterSubscribers] (Email, SubscribedAt, UserId) VALUES ('dave@example.com', '2025-09-05T08:15:00', NULL)");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the seeded rows by email
            migrationBuilder.Sql("DELETE FROM [NewsletterSubscribers] WHERE Email IN ('alice@example.com','bob@example.com','carol@example.com','dave@example.com')");
        }
    }
}
