using System;
using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class CategoryUpdateDto
{
    [Required(ErrorMessage = "Kategori adı zorunludur.")]
    [StringLength(50, ErrorMessage = "Kategori adı en fazla 50 karakter olabilir.")]
    public string Name { get; set; }
}
