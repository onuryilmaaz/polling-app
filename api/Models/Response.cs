using System;

namespace api.Models;

public class Response
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public string? UserId { get; set; }  // Null ise anonim kullanıcı
    public string? SessionId { get; set; } // Anonim kullanıcılar için
    public DateTime SubmittedDate { get; set; }

    // Navigation properties
    public Poll? Poll { get; set; }
    public User? User { get; set; }
    public ICollection<Answer>? Answers { get; set; }
}
