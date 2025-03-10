using System;

namespace api.Models;

public class Option
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string? Text { get; set; }
    public int OrderIndex { get; set; }

    // Navigation property
    public Question? Question { get; set; }
}
