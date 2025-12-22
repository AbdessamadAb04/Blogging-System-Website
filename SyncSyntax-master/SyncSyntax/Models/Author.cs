using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace SyncSyntax.Models
{
    public class Author
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Full name is required.")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters.")]
        public string FullName { get; set; }

        public string? Description { get; set; }

        // Date when the author joined the platform
        public DateTime JoinedAt { get; set; }

        // Optional avatar URL (may be null)
        public string? AvatarUrl { get; set; }

        [ValidateNever]
        public ICollection<Post> Posts { get; set; } = new List<Post>();

        public Author()
        {
            // default to UTC now for new authors
            JoinedAt = DateTime.UtcNow;
        }
    }
}