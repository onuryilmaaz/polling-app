using System;

namespace api.Dtos;

public class PollCreateDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public List<QuestionCreateDto>? Questions { get; set; }
}
