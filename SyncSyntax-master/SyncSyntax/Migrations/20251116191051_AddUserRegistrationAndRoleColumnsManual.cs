using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRegistrationAndRoleColumnsManual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationDate",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "AspNetUsers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET RegistrationDate = GETUTCDATE()
                WHERE RegistrationDate IS NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET [Role] = 'User'
                WHERE [Role] IS NULL;
            ");

            migrationBuilder.Sql(@"
                DECLARE @adminRoleId nvarchar(450);
                SELECT @adminRoleId = Id FROM AspNetRoles WHERE Name = 'Admin';
                IF @adminRoleId IS NOT NULL
                BEGIN
                    UPDATE u
                    SET [Role] = 'Admin'
                    FROM AspNetUsers u
                    INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                    WHERE ur.RoleId = @adminRoleId;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RegistrationDate",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "AspNetUsers");
        }
    }
}
