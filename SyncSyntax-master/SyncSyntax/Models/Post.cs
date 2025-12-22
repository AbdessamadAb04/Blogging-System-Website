using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using SyncSyntax.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Post
{
    [Key]
    public int Id { get; set; }

    [Required(ErrorMessage = "The title is required.")]
    [MaxLength(200, ErrorMessage = "The title cannot exceed 200 characters.")]
    public string Title { get; set; }

    [MaxLength(500, ErrorMessage = "The subtitle cannot exceed 500 characters.")]
    public string? Subtitle { get; set; }

    [Required(ErrorMessage = "Content is required.")]
    public string Content { get; set; }

    [ValidateNever]
    public string FeatureImagePath { get; set; }
  
    [DataType(DataType.Date)]
    public DateTime PublishedDate { get; set; } = DateTime.Now;

    [ForeignKey("Category")]
    public int CategoryId { get; set; }
    [ValidateNever]
    public Category Category { get; set; }

    [ForeignKey("Author")]
    public int? AuthorId { get; set; }
    [ValidateNever]
    public Author? Author { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Draft";

    [ValidateNever]
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    [ValidateNever]
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
}
