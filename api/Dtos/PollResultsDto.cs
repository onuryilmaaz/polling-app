using System;

namespace api.Dtos;

public class PollResultsDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public int TotalResponses { get; set; }
    public List<QuestionResultDto> Questions { get; set; } = new List<QuestionResultDto>();

}
