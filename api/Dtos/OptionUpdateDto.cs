using System;

namespace api.Dtos;

public class OptionUpdateDto
{
    public int? Id { get; set; } // Null ise yeni seçenek
    public string Text { get; set; }
    public int OrderIndex { get; set; }
}
