using System;

namespace api.Models;

public class SelectedOption
{
    public int Id { get; set; }
    public int AnswerId { get; set; }
    public int OptionId { get; set; }
    public int? RankOrder { get; set; } // Sıralama için

    // Navigation properties
    public Answer? Answer { get; set; }
    public Option? Option { get; set; }
}
