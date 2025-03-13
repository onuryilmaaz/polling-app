using System;

namespace api.Dtos;

public class OptionResultDto
{
    public int OptionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}
