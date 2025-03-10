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

    //     builder.Entity<Poll>()
    //         .HasOne(s => s.CreatedByUser)
    //         .WithMany()
    //         .HasForeignKey(s => s.CreatedByUserId)
    //         .HasPrincipalKey(u => u.Id)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<Question>()
    //         .HasOne(q => q.Poll)
    //         .WithMany(s => s.Questions)
    //         .HasForeignKey(q => q.PollId)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<Option>()
    //         .HasOne(o => o.Question)
    //         .WithMany(q => q.Options)
    //         .HasForeignKey(o => o.QuestionId)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<Response>()
    //         .HasOne(r => r.Poll)
    //         .WithMany(s => s.Responses)
    //         .HasForeignKey(r => r.PollId)
    //         .OnDelete(DeleteBehavior.ClientSetNull); // Restrict yerine Cascade yapın

    //     builder.Entity<Response>()
    //         .HasOne(r => r.User)
    //         .WithMany()
    //         .HasForeignKey(r => r.UserId)
    //         .OnDelete(DeleteBehavior.Restrict);

    //     builder.Entity<Answer>()
    //         .HasOne(a => a.Response)
    //         .WithMany(r => r.Answers)
    //         .HasForeignKey(a => a.ResponseId)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<Answer>()
    //         .HasOne(a => a.Question)
    //         .WithMany()
    //         .HasForeignKey(a => a.QuestionId)
    //         .OnDelete(DeleteBehavior.Restrict);

    //     builder.Entity<SelectedOption>()
    //         .HasOne(so => so.Answer)
    //         .WithMany(a => a.SelectedOptions)
    //         .HasForeignKey(so => so.AnswerId)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<SelectedOption>()
    //         .HasOne(so => so.Option)
    //         .WithMany()
    //         .HasForeignKey(so => so.OptionId)
    //         .OnDelete(DeleteBehavior.Restrict);
    // }

    // protected override void OnModelCreating(ModelBuilder builder)
    // {
    //     base.OnModelCreating(builder);

    //     builder.Entity<Poll>()
    //         .HasOne(s => s.CreatedByUser)
    //         .WithMany() 
    //         .HasForeignKey(s => s.CreatedByUserId)
    //         .HasPrincipalKey(u => u.Id);

    //     builder.Entity<Question>()
    //         .HasOne(q => q.Poll)
    //         .WithMany(s => s.Questions)
    //         .HasForeignKey(q => q.PollId);

    //     builder.Entity<Question>()
    //         .HasMany(q => q.Answers)
    //         .WithOne(a => a.Question)
    //         .HasForeignKey(a => a.QuestionId)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<Question>()
    //         .HasMany(q => q.Options)
    //         .WithOne(o => o.Question)
    //         .HasForeignKey(o => o.QuestionId)
    //         .OnDelete(DeleteBehavior.Cascade);

    //     builder.Entity<Option>()
    //         .HasOne(o => o.Question)
    //         .WithMany(q => q.Options)
    //         .HasForeignKey(o => o.QuestionId);

    //     builder.Entity<Response>()
    //         .HasOne(r => r.Poll)
    //         .WithMany(s => s.Responses)
    //         .HasForeignKey(r => r.PollId); // Silme ilişkisi kaldırıldı

    //     builder.Entity<Response>()
    //         .HasOne(r => r.User)
    //         .WithMany()
    //         .HasForeignKey(r => r.UserId); // Silme ilişkisi kaldırıldı

    //     builder.Entity<Answer>()
    //         .HasOne(a => a.Response)
    //         .WithMany(r => r.Answers)
    //         .HasForeignKey(a => a.ResponseId); // Silme ilişkisi kaldırıldı

    //     builder.Entity<Answer>()
    //         .HasOne(a => a.Question)
    //         .WithMany()
    //         .HasForeignKey(a => a.QuestionId); // Silme ilişkisi kaldırıldı

    //     builder.Entity<SelectedOption>()
    //         .HasOne(so => so.Answer)
    //         .WithMany(a => a.SelectedOptions)
    //         .HasForeignKey(so => so.AnswerId); // Silme ilişkisi kaldırıldı

    //     builder.Entity<SelectedOption>()
    //         .HasOne(so => so.Option)
    //         .WithMany()
    //         .HasForeignKey(so => so.OptionId); // Silme ilişkisi kaldırıldı
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

        // Answer -> SelectedOptions (Cascade)
        builder.Entity<Answer>()
            .HasMany(a => a.SelectedOptions)
            .WithOne(so => so.Answer)
            .OnDelete(DeleteBehavior.Cascade);
    }
}