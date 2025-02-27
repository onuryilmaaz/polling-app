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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // İlişkileri yapılandırma
        builder.Entity<Poll>()
            .HasOne(s => s.CreatedByUser)
            .WithMany()
            .HasForeignKey(s => s.CreatedByUserId)
            .HasPrincipalKey(u => u.Id)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Question>()
            .HasOne(q => q.Poll)
            .WithMany(s => s.Questions)
            .HasForeignKey(q => q.PollId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Option>()
            .HasOne(o => o.Question)
            .WithMany(q => q.Options)
            .HasForeignKey(o => o.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Response>()
            .HasOne(r => r.Poll)
            .WithMany(s => s.Responses)
            .HasForeignKey(r => r.PollId)
            .OnDelete(DeleteBehavior.Restrict); // NoAction yerine Restrict daha iyi

        builder.Entity<Response>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Answer>()
            .HasOne(a => a.Response)
            .WithMany(r => r.Answers)
            .HasForeignKey(a => a.ResponseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Answer>()
            .HasOne(a => a.Question)
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<SelectedOption>()
            .HasOne(so => so.Answer)
            .WithMany(a => a.SelectedOptions)
            .HasForeignKey(so => so.AnswerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SelectedOption>()
            .HasOne(so => so.Option)
            .WithMany()
            .HasForeignKey(so => so.OptionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
