using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SyncSyntax.Migrations
{
    public partial class AddUserRegistrationAndRoleColumnsFix : Migration
    {
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

            // Populate RegistrationDate for existing users
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET RegistrationDate = ISNULL(RegistrationDate, GETUTCDATE())
                WHERE RegistrationDate IS NULL;
            ");

            // Default Role to 'User'
            migrationBuilder.Sql(@"
                UPDATE AspNetUsers
                SET [Role] = 'User'
                WHERE [Role] IS NULL;
            ");

            // Set Role = 'Admin' for users in Admin role
            migrationBuilder.Sql(@"
                UPDATE u
                SET [Role] = 'Admin'
                FROM AspNetUsers u
                INNER JOIN AspNetUserRoles ur ON ur.UserId = u.Id
                INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE r.Name = 'Admin';
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
