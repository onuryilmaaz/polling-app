using System;

namespace api.Models;

public class Answer
{
    public int Id { get; set; }
    public int ResponseId { get; set; }
    public int QuestionId { get; set; }

    // Navigation properties
    public Response? Response { get; set; }
    public virtual Question? Question { get; set; }

    // Farklı soru tipleri için cevap alanları
    public string? TextAnswer { get; set; }
    public ICollection<SelectedOption>? SelectedOptions { get; set; }
}
