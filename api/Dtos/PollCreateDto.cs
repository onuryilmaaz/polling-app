using System;

namespace api.Dtos;

public class PollCreateDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public List<QuestionCreateDto>? Questions { get; set; }

    // Kategori bilgisi (ID veya yeni kategori adı)
    public int? CategoryId { get; set; } // Mevcut kategorilerden birini seçmek için
    public string NewCategoryName { get; set; } // Yeni kategori oluşturmak için
}
