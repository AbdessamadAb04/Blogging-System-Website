using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    public partial class AddUserRegistrationAndRoleColumns_Manual : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add RegistrationDate column
            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationDate",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            // Add denormalized Role column (for quick queries)
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "AspNetUsers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Populate RegistrationDate for existing users with current UTC time where null
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET RegistrationDate = GETUTCDATE()
                WHERE RegistrationDate IS NULL;
            ");

            // Default Role to 'User' for existing rows
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET [Role] = 'User'
                WHERE [Role] IS NULL;
            ");

            // If Admin role exists, set Role='Admin' for users in that role
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
