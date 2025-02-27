using System;

namespace api.Dtos;

public class AnswerDto
{
    public int QuestionId { get; set; }
    public string? TextAnswer { get; set; }
    public Dictionary<int, int?>? SelectedOptionIds { get; set; } // Key: OptionId, Value: RankOrder (null for non-ranking questions)
}
