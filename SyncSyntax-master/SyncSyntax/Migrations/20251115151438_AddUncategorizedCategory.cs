using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    /// <inheritdoc />
    public partial class AddUncategorizedCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Name", "Description" },
                values: new object[] { "Uncategorized", "Posts that have not been assigned to a specific category" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Categories WHERE Name = 'Uncategorized'");
        }
    }
}
