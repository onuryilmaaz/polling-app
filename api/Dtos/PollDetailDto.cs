using System;

namespace api.Dtos;

public class PollDetailDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public List<QuestionDetailDto>? Questions { get; set; }
}
