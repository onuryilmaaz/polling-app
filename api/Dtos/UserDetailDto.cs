using System;

namespace api.Dtos;

public class UserDetailDto
{
    public string? Id { get; set; }
    public string? FullName { get; set; }
    public bool IsActive { get; set; }
    public string? Email { get; set; }
    public string[]? Roles { get; set; }
}
