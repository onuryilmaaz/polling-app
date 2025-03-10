using System;

namespace api.Dtos;

public class PollListDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public int QuestionCount { get; set; }
    public int ResponseCount { get; set; }
}
