using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

public class Poll
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public string? CreatedByUserId { get; set; }
    public int? CategoryId { get; set; }

    // Navigation properties
    public User? CreatedByUser { get; set; }
    public ICollection<Question>? Questions { get; set; }
    public ICollection<Response>? Responses { get; set; }
    public PollCategory? Category { get; set; }
}
