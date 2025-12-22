using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SyncSyntax.Models;

namespace SyncSyntax.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
     
        public DbSet<Post> Posts { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Author> Authors { get; set; }
        public DbSet<PostLike> PostLikes { get; set; }
        public DbSet<NewsletterSubscriber> NewsletterSubscribers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure PostLike
            modelBuilder.Entity<PostLike>()
                .HasIndex(pl => new { pl.PostId, pl.UserId })
                .IsUnique()
                .HasDatabaseName("IX_PostLikes_PostId_UserId");

            modelBuilder.Entity<PostLike>()
                .HasOne(pl => pl.Post)
                .WithMany(p => p.Likes)
                .HasForeignKey(pl => pl.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PostLike>()
                .HasOne(pl => pl.User)
                .WithMany()
                .HasForeignKey(pl => pl.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Call the Seed method to populate initial data
            Seed(modelBuilder);
        }

        public static void Seed(ModelBuilder modelBuilder)
        {
            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Technology" },
                new Category { Id = 2, Name = "Health" },
                new Category { Id = 3, Name = "Lifestyle" }
            );

            // Note: Post seeding removed since you have real data in the database
            // The actual posts and authors are managed directly in your database
        }

    }


}


