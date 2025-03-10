using System;
using api.Models;

namespace api.Dtos;

public class QuestionDetailDto
{
    public int Id { get; set; }
    public string? Text { get; set; }
    public QuestionType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsRequired { get; set; }
    public int? MaxSelections { get; set; }
    public List<OptionDetailDto>? Options { get; set; }
}
