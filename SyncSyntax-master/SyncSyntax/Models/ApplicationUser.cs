using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations; // For MaxLength

namespace SyncSyntax.Models
{
    public class ApplicationUser : IdentityUser
    {
        public DateTime RegistrationDate { get; set; } = DateTime.Now;

        [MaxLength(256)]
        public string? FullName { get; set; }

        [MaxLength(256)] // Identity roles are often 256, user role column might be similar.
        public string? Role { get; set; }
    }
}
