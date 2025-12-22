using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace SyncSyntax.Models
{
    public class PostLike
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Post")]
        public int PostId { get; set; }
        [ValidateNever]
        public Post Post { get; set; }

        [Required]
        [ForeignKey("User")]
        public string UserId { get; set; }
        [ValidateNever]
        public ApplicationUser User { get; set; }

        [Required]
        public DateTime LikedAt { get; set; } = DateTime.Now;
    }
}
