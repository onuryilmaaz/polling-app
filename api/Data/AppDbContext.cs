using System;
using api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public class AppDbContext : IdentityDbContext<User>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Anket Sistemi Tabloları
    public DbSet<Poll> Polls { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Option> Options { get; set; }
    public DbSet<Response> Responses { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<SelectedOption> SelectedOptions { get; set; }

    // protected override void OnModelCreating(ModelBuilder builder)
    // {
    //     base.OnModelCreating(builder);

    //     // Poll -> Questions (Cascade)
    //     builder.Entity<Poll>()
    //         .HasMany(p => p.Questions)
    //         .WithOne(q => q.Poll)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     // Poll -> Responses (Cascade)
    //     builder.Entity<Poll>()
    //         .HasMany(p => p.Responses)
    //         .WithOne(r => r.Poll)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     // Question -> Options (Cascade)
    //     builder.Entity<Question>()
    //         .HasMany(q => q.Options)
    //         .WithOne(o => o.Question)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     // Response -> Answers (Cascade)
    //     builder.Entity<Response>()
    //         .HasMany(r => r.Answers)
    //         .WithOne(a => a.Response)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     // Answer -> SelectedOptions (Cascade)
    //     builder.Entity<Answer>()
    //         .HasMany(a => a.SelectedOptions)
    //         .WithOne(so => so.Answer)
    //         .OnDelete(DeleteBehavior.NoAction);
    // }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Poll -> Questions (Cascade)
        builder.Entity<Poll>()
            .HasMany(p => p.Questions)
            .WithOne(q => q.Poll)
            .OnDelete(DeleteBehavior.Cascade);

        // Poll -> Responses (Cascade)
        builder.Entity<Poll>()
            .HasMany(p => p.Responses)
            .WithOne(r => r.Poll)
            .OnDelete(DeleteBehavior.Cascade);

        // Question -> Options (Cascade)
        builder.Entity<Question>()
            .HasMany(q => q.Options)
            .WithOne(o => o.Question)
            .OnDelete(DeleteBehavior.Cascade);

        // Response -> Answers (Cascade)
        builder.Entity<Response>()
            .HasMany(r => r.Answers)
            .WithOne(a => a.Response)
            .OnDelete(DeleteBehavior.Cascade);

        // Answer -> Question (NoAction)
        builder.Entity<Answer>()
            .HasOne(a => a.Question)
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.NoAction);

        // Answer -> SelectedOptions (Cascade)
        builder.Entity<Answer>()
            .HasMany(a => a.SelectedOptions)
            .WithOne(so => so.Answer)
            .OnDelete(DeleteBehavior.Cascade);

        // SelectedOption -> Option (NoAction)
        builder.Entity<SelectedOption>()
            .HasOne(so => so.Option)
            .WithMany()
            .HasForeignKey(so => so.OptionId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

