using System;
using api.Models;

namespace api.Dtos;

public class QuestionUpdateDto
{
    public int? Id { get; set; } // Null ise yeni soru
    public string Text { get; set; }
    public QuestionType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsRequired { get; set; }
    public int? MaxSelections { get; set; }
    public List<OptionUpdateDto> Options { get; set; }
}
