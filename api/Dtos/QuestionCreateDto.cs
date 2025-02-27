using System;
using api.Models;

namespace api.Dtos;

public class QuestionCreateDto
{
    public string? Text { get; set; }
    public QuestionType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsRequired { get; set; }
    public int? MaxSelections { get; set; }
    public List<OptionCreateDto>? Options { get; set; }
}
