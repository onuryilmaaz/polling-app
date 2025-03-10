using System;

namespace api.Models;

public class Question
{
    public int Id { get; set; }
    public int PollId { get; set; }
    public string? Text { get; set; }
    public QuestionType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsRequired { get; set; }

    // Sıralama tipi sorular için
    public int? MaxSelections { get; set; }

    // Navigation properties
    public Poll? Poll { get; set; }
    public List<Option>? Options { get; set; }
    public List<Answer>? Answers { get; set; }
}

public enum QuestionType
{
    MultipleChoice, // Çoktan seçmeli (tek seçim)
    Text,           // Metin cevap
    YesNo,          // Evet/Hayır
    MultiSelect,    // Çoklu seçim
    Ranking         // Sıralama
}
