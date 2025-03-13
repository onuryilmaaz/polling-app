using System;

namespace api.Dtos;

public class QuestionResultDto
{
    public int QuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int TotalAnswers { get; set; }
    public List<OptionResultDto>? Options { get; set; }
    public List<string>? TextAnswers { get; set; }
    public List<RankingResultDto>? RankingResults { get; set; }
}
