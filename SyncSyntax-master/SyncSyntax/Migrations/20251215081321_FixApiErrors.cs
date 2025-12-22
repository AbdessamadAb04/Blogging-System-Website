using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    /// <inheritdoc />
    public partial class FixApiErrors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "NewsletterSubscribers");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "NewsletterSubscribers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "NewsletterSubscribers");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "NewsletterSubscribers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
