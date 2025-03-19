using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace api.Dtos;

public class CategoryListDto
{
    public int Id { get; set; }

    public string Name { get; set; }
}