using System;

namespace api.Dtos;

public class PollResponseDto
{
    public List<AnswerDto>? Answers { get; set; }
}
