using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    public partial class AddUserIdToNewsletterSubscribers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add nullable UserId column (nvarchar(450)) to hold AspNetUsers.Id
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "NewsletterSubscribers",
                type: "nvarchar(450)",
                nullable: true);

            // Create index and foreign key to AspNetUsers(Id)
            migrationBuilder.CreateIndex(
                name: "IX_NewsletterSubscribers_UserId",
                table: "NewsletterSubscribers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_NewsletterSubscribers_AspNetUsers_UserId",
                table: "NewsletterSubscribers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Drop the IsActive column (no longer used)
            // Use SQL safe fallback if column may not exist.
            try
            {
                migrationBuilder.Sql("IF EXISTS(SELECT * FROM sys.columns WHERE Name = N'IsActive' AND Object_ID = Object_ID(N'[NewsletterSubscribers]')) ALTER TABLE [NewsletterSubscribers] DROP COLUMN [IsActive]");
            }
            catch
            {
                // swallow to keep migration idempotent in dev scenarios
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add back the IsActive column as non-nullable boolean (default true)
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "NewsletterSubscribers",
                type: "bit",
                nullable: false,
                defaultValue: true);

            // Drop foreign key and index
            migrationBuilder.DropForeignKey(
                name: "FK_NewsletterSubscribers_AspNetUsers_UserId",
                table: "NewsletterSubscribers");

            migrationBuilder.DropIndex(
                name: "IX_NewsletterSubscribers_UserId",
                table: "NewsletterSubscribers");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "NewsletterSubscribers");
        }
    }
}
