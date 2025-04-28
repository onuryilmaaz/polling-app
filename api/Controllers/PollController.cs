using api.Data;
using api.Dtos;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class PollController : ControllerBase
{
    private readonly AppDbContext _context;

    public PollController(AppDbContext context)
    {
        _context = context;
    }

    #region Anket Oluşturma
    // Admin'in anket oluşturması için metot
    [HttpPost("create")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePoll([FromBody] PollCreateDto pollDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Giriş yapmış kullanıcının ID'sini al
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı.");
            }

            Guid userId = Guid.Parse(userIdClaim.Value);

            // Kategori kontrolü
            if (pollDto.CategoryId == null)
            {
                return BadRequest("Bir kategori seçilmelidir.");
            }

            // Seçilen kategorinin varlığını kontrol et
            var category = await _context.PollCategories.FindAsync(pollDto.CategoryId);
            if (category == null)
            {
                return BadRequest("Seçilen kategori bulunamadı.");
            }

            // Yeni anket oluştur
            var poll = new Poll
            {
                Title = pollDto.Title ?? string.Empty,
                Description = pollDto.Description,
                CreatedDate = pollDto.CreatedDate,
                ExpiryDate = pollDto.ExpiryDate,
                IsActive = pollDto.IsActive,
                CreatedByUserId = userId.ToString(),
                Questions = new List<Question>(),
                CategoryId = pollDto.CategoryId
            };

            // Soruları ekle
            if (pollDto.Questions != null)
            {
                foreach (var questionDto in pollDto.Questions)
                {
                    var question = new Question
                    {
                        Text = questionDto.Text ?? string.Empty,
                        Type = questionDto.Type,
                        OrderIndex = questionDto.OrderIndex,
                        IsRequired = questionDto.IsRequired,
                        MaxSelections = questionDto.Type == QuestionType.MultipleChoice
                                || questionDto.Type == QuestionType.Ranking
                                ? questionDto.MaxSelections
                                : null,
                        Options = new List<Option>()
                    };

                    if (question.Type == QuestionType.YesNo)
                    {
                        question.Options.Add(new Option { Text = "Evet", OrderIndex = 0 });
                        question.Options.Add(new Option { Text = "Hayır", OrderIndex = 1 });
                        questionDto.Options = null;
                    }
                    else if (questionDto.Options != null)
                    {
                        int orderIndex = 0;
                        foreach (var optionDto in questionDto.Options)
                        {
                            var option = new Option
                            {
                                Text = optionDto.Text ?? string.Empty,
                                OrderIndex = optionDto.OrderIndex >= 0 ? optionDto.OrderIndex : orderIndex
                            };

                            question.Options.Add(option);
                            orderIndex++;
                        }
                    }

                    poll.Questions.Add(question);
                }
            }
            _context.Polls.Add(poll);
            await _context.SaveChangesAsync();
            _context.ChangeTracker.DetectChanges();
            await transaction.CommitAsync();

            return CreatedAtAction(nameof(GetPollById), new { id = poll.Id },
            new
            {
                id = poll.Id,
                title = poll.Title,
                categoryId = poll.CategoryId,
                categoryName = category.Name,
                questions = poll.Questions.Select(q => new
                {
                    q.Id,
                    q.Text,
                    options = q.Options.Select(o => new { o.Id, o.Text, o.OrderIndex }).ToList()
                }).ToList(),
                message = "Anket başarıyla oluşturuldu."
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Anket oluşturulurken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Anket Güncelleme
    [HttpPut("update/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePoll(int id, [FromBody] PollUpdateDto pollDto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var poll = await _context.Polls
                .Include(s => s.Questions)
                    .ThenInclude(q => q.Options)
                .Include(s => s.Questions)
                    .ThenInclude(q => q.Answers) // Answers ilişkisini ekledik
                .FirstOrDefaultAsync(s => s.Id == id);

            if (poll == null) return NotFound("Anket bulunamadı.");

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            if (!Guid.TryParse(poll.CreatedByUserId, out var createdBy) ||
                createdBy != Guid.Parse(userIdClaim.Value))
            {
                return Forbid();
            }

            // Ana bilgileri güncelle
            poll.Title = pollDto.Title ?? string.Empty;
            poll.Description = pollDto.Description;
            poll.ExpiryDate = pollDto.ExpiryDate;
            poll.IsActive = pollDto.IsActive;

            // Tüm ilişkili verileri sil
            foreach (var question in poll.Questions.ToList())
            {
                //_context.Questions.Where(x=>zzz)
                // // Önce cevapları sil
                // _context.Answers.RemoveRange(question.Answers);

                // Önce o soruya bağlı cevapları veritabanından çekip sil
                var answers = _context.Answers.Where(a => a.QuestionId == question.Id);
                _context.Answers.RemoveRange(answers);

                // Önce seçeneklerin bağlı olduğu SelectedOptions kayıtlarını sil
                foreach (var option in question.Options)
                {
                    var selectedOptions = _context.SelectedOptions.Where(so => so.OptionId == option.Id);
                    _context.SelectedOptions.RemoveRange(selectedOptions);
                }

                // Sonra seçenekleri sil
                _context.Options.RemoveRange(question.Options);

                // En son soruyu sil
                _context.Questions.Remove(question);
            }

            // Yeni soruları ekle
            foreach (var questionDto in pollDto.Questions)
            {
                var question = new Question
                {
                    Text = questionDto.Text ?? string.Empty,
                    Type = questionDto.Type,
                    OrderIndex = questionDto.OrderIndex,
                    IsRequired = questionDto.IsRequired,
                    MaxSelections =
                                  questionDto.Type == QuestionType.Ranking
                                  ? questionDto.MaxSelections
                                  : null,
                    Options = new List<Option>()
                };

                if (question.Type == QuestionType.YesNo)
                {
                    question.Options.Add(new Option { Text = "Evet", OrderIndex = 0 });
                    question.Options.Add(new Option { Text = "Hayır", OrderIndex = 1 });
                    questionDto.Options = null;
                }
                else if (questionDto.Options != null)
                {
                    int orderIndex = 0;
                    foreach (var optionDto in questionDto.Options)
                    {
                        var option = new Option
                        {
                            Text = optionDto.Text ?? string.Empty,
                            OrderIndex = optionDto.OrderIndex >= 0 ? optionDto.OrderIndex : orderIndex
                        };

                        question.Options.Add(option);
                        orderIndex++;
                    }
                }

                poll.Questions.Add(question);
            }
            _context.Polls.Update(poll);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return CreatedAtAction(nameof(GetPollById), new { id = poll.Id },
            new
            {
                id = poll.Id,
                title = poll.Title,
                questions = poll.Questions.Select(q => new
                {
                    q.Id,
                    q.Text,
                    options = q.Options.Select(o => new { o.Id, o.Text, o.OrderIndex }).ToList()
                }).ToList(),
                message = "Anket başarıyla güncellendi."
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Detaylı hata: {ex.InnerException?.Message ?? ex.Message}");
        }
    }
    #endregion

    #region Anket Silme
    [HttpDelete("delete/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePoll(int id)
    {
        var poll = await _context.Polls
            .Include(p => p.Responses)
                .ThenInclude(r => r.Answers)
                    .ThenInclude(a => a.SelectedOptions)
            .Include(p => p.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (poll == null)
        {
            return NotFound(new
            {
                Success = false,
                Message = "Silinmek istenen anket bulunamadı."
            });
        }

        try
        {
            // İlişkili verileri manuel silme (Cascade aktif değilse)
            _context.SelectedOptions.RemoveRange(poll.Responses.SelectMany(r => r.Answers.SelectMany(a => a.SelectedOptions)));
            _context.Answers.RemoveRange(poll.Responses.SelectMany(r => r.Answers));
            _context.Options.RemoveRange(poll.Questions.SelectMany(q => q.Options));
            _context.Questions.RemoveRange(poll.Questions);
            _context.Responses.RemoveRange(poll.Responses);
            _context.Polls.Remove(poll);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Anket ve ilişkili tüm veriler başarıyla silindi.",
                DeletedPollId = id
            });
        }
        catch (Exception ex)
        {
            // Hata durumunda loglama yapılabilir
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                Success = false,
                Message = "Anket silinirken bir hata oluştu.",
                Error = ex.Message
            });
        }
    }
    #endregion

    #region Anket Sonuçları
    [HttpGet("results/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPollResults(int id)
    {
        try
        {
            var poll = await _context.Polls
                .Include(p => p.Questions)
                    .ThenInclude(q => q.Options)
                .Include(p => p.Responses)
                    .ThenInclude(r => r.Answers)
                        .ThenInclude(a => a.SelectedOptions)
                            .ThenInclude(so => so.Option)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (poll == null)
            {
                return NotFound("Anket bulunamadı.");
            }

            // Kullanıcı kimliğini al
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı.");
            }

            if (!Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return Unauthorized("Geçersiz kullanıcı kimliği.");
            }

            // Anketi oluşturan kişi mi kontrol et
            if (Guid.TryParse(poll.CreatedByUserId, out Guid creatorId) && creatorId != userId)
            {
                return Forbid("Bu anketin sonuçlarını görüntülemeye yetkiniz yok.");
            }

            var totalResponses = poll.Responses.Count;

            var results = new
            {
                PollId = poll.Id,
                Title = poll.Title,
                Description = poll.Description,
                CreatedDate = poll.CreatedDate,
                ExpiryDate = poll.ExpiryDate,
                IsActive = poll.IsActive,
                TotalResponses = totalResponses,
                Questions = poll.Questions.OrderBy(q => q.OrderIndex).Select(q =>
                {
                    var questionResults = new
                    {
                        QuestionId = q.Id,
                        Text = q.Text,
                        Type = q.Type.ToString(),
                        MaxSelections = q.MaxSelections,
                        IsRequired = q.IsRequired,
                        TotalAnswers = poll.Responses.Count(r => r.Answers.Any(a => a.QuestionId == q.Id)),

                        // For non-text questions, show option results
                        Options = q.Type != QuestionType.Text ? q.Options.OrderBy(o => o.OrderIndex).Select(o =>
                        {
                            var selectedCount = poll.Responses
                                .SelectMany(r => r.Answers)
                                .Where(a => a.QuestionId == q.Id)
                                .SelectMany(a => a.SelectedOptions)
                                .Count(so => so.OptionId == o.Id);

                            double percentage = totalResponses > 0 ? (double)selectedCount / totalResponses * 100 : 0;

                            return new
                            {
                                OptionId = o.Id,
                                Text = o.Text,
                                Count = selectedCount,
                                Percentage = Math.Round(percentage, 2)
                            };
                        }).ToList() : null,

                        // Only for text questions, collect text answers
                        TextAnswers = q.Type == QuestionType.Text ? poll.Responses
                            .SelectMany(r => r.Answers)
                            .Where(a => a.QuestionId == q.Id && !string.IsNullOrEmpty(a.TextAnswer))
                            .Select(a => a.TextAnswer)
                            .ToList() : null,

                        // For ranking questions, show rank distribution
                        RankingResults = q.Type == QuestionType.Ranking ? q.Options.OrderBy(o => o.OrderIndex).Select(o =>
                        {
                            var rankCounts = poll.Responses
                                .SelectMany(r => r.Answers)
                                .Where(a => a.QuestionId == q.Id)
                                .SelectMany(a => a.SelectedOptions)
                                .Where(so => so.OptionId == o.Id && so.RankOrder.HasValue)
                                .GroupBy(so => so.RankOrder.Value)
                                .Select(g => new { Rank = g.Key, Count = g.Count() })
                                .OrderBy(x => x.Rank)
                                .ToList();

                            return new
                            {
                                OptionId = o.Id,
                                Text = o.Text,
                                RankDistribution = rankCounts
                            };
                        }).ToList() : null,

                        // For MultiSelect questions, show selection frequencies
                        MultiSelectResults = q.Type == QuestionType.MultiSelect ? new
                        {
                            SelectionCounts = q.Options.OrderBy(o => o.OrderIndex).Select(o =>
                            {
                                var count = poll.Responses
                                    .SelectMany(r => r.Answers)
                                    .Where(a => a.QuestionId == q.Id)
                                    .SelectMany(a => a.SelectedOptions)
                                    .Count(so => so.OptionId == o.Id);

                                double percentage = totalResponses > 0 ? (double)count / totalResponses * 100 : 0;

                                return new
                                {
                                    OptionId = o.Id,
                                    Text = o.Text,
                                    Count = count,
                                    Percentage = Math.Round(percentage, 2)
                                };
                            }).ToList()
                        } : null
                    };

                    return questionResults;
                }).ToList()
            };

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anket sonuçları alınırken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Anket Özet İstatistikleri
    [HttpGet("summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPollsSummary()
    {
        try
        {
            // Kullanıcı kimliğini al
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı.");
            }

            if (!Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return Unauthorized("Geçersiz kullanıcı kimliği.");
            }

            // Tüm anketleri yükle
            var polls = await _context.Polls
                .Include(p => p.Questions)
                .Include(p => p.Responses)
                    .ThenInclude(r => r.Answers)
                .Include(p => p.Category)
                .ToListAsync();

            // Sadece kullanıcının oluşturduğu anketleri filtrele
            var userPolls = polls.Where(p => Guid.TryParse(p.CreatedByUserId, out Guid creatorId) && creatorId == userId).ToList();

            // Kategorileri al - sadece CategoryId'ye göre gruplanmış anketler
            var pollCategories = userPolls
                .Where(p => p.CategoryId.HasValue)
                .GroupBy(p => p.CategoryId)
                .Select(g => new { CategoryId = g.Key, PollCount = g.Count() })
                .ToList();

            // Özet istatistikleri hesapla
            var summary = new
            {
                TotalPolls = userPolls.Count,
                TotalQuestions = userPolls.Sum(p => p.Questions.Count),
                TotalResponses = userPolls.Sum(p => p.Responses.Count),
                TotalAnswers = userPolls.Sum(p => p.Responses.Sum(r => r.Answers.Count)),
                ActivePolls = userPolls.Count(p => p.IsActive),
                ExpiredPolls = userPolls.Count(p => p.ExpiryDate.HasValue && p.ExpiryDate < DateTime.UtcNow),
                AverageQuestionsPerPoll = userPolls.Count > 0 ? Math.Round((double)userPolls.Sum(p => p.Questions.Count) / userPolls.Count, 2) : 0,
                AverageResponsesPerPoll = userPolls.Count > 0 ? Math.Round((double)userPolls.Sum(p => p.Responses.Count) / userPolls.Count, 2) : 0,
                Category = polls.Select(c => new
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.Category.Name,
                    PollCount = polls.Count(p => p.CategoryId == c.CategoryId),
                    TotalResponses = userPolls.Where(p => p.CategoryId == c.CategoryId).Sum(p => p.Responses.Count),
                }).ToList(),

                // Kategori bazında anket dağılımı (sadece CategoryId kullanılıyor)
                Categories = pollCategories.Select(c => new
                {
                    CategoryId = c.CategoryId,
                    PollCount = c.PollCount,
                    TotalResponses = userPolls.Where(p => p.CategoryId == c.CategoryId).Sum(p => p.Responses.Count),
                    AverageResponsesPerPoll = c.PollCount > 0 ?
                        Math.Round((double)userPolls.Where(p => p.CategoryId == c.CategoryId).Sum(p => p.Responses.Count) / c.PollCount, 2) : 0
                }).OrderByDescending(c => c.PollCount).ToList(),

                // Anket tiplerine göre özet (aktif/pasif, süresi dolmuş vs.)
                PollStatusSummary = new
                {
                    Active = userPolls.Count(p => p.IsActive && (!p.ExpiryDate.HasValue || p.ExpiryDate >= DateTime.UtcNow)),
                    Inactive = userPolls.Count(p => !p.IsActive),
                    Expired = userPolls.Count(p => p.IsActive && p.ExpiryDate.HasValue && p.ExpiryDate < DateTime.UtcNow)
                },

                // En popüler anketler (en çok cevaplanan)
                TopPolls = userPolls
                    .OrderByDescending(p => p.Responses.Count)
                    .Take(5)
                    .Select(p => new
                    {
                        PollId = p.Id,
                        Title = p.Title,
                        CategoryId = p.CategoryId,
                        CategoryName = p.Category.Name,
                        ResponseCount = p.Responses.Count,
                        QuestionCount = p.Questions.Count,
                        CreatedDate = p.CreatedDate,
                        IsActive = p.IsActive
                    }).ToList(),

                // En son oluşturulan anketler
                RecentPolls = userPolls
                    .OrderByDescending(p => p.CreatedDate)
                    .Take(5)
                    .Select(p => new
                    {
                        PollId = p.Id,
                        Title = p.Title,
                        CategoryId = p.CategoryId,
                        ResponseCount = p.Responses.Count,
                        QuestionCount = p.Questions.Count,
                        CreatedDate = p.CreatedDate,
                        IsActive = p.IsActive
                    }).ToList(),

                // Aylara göre anket dağılımı (son 6 ay)
                MonthlyDistribution = Enumerable.Range(0, 6)
                    .Select(i => DateTime.UtcNow.AddMonths(-i))
                    .Select(date => new
                    {
                        Month = date.ToString("MMMM yyyy"),
                        PollsCreated = userPolls.Count(p => p.CreatedDate.Year == date.Year && p.CreatedDate.Month == date.Month),
                        ResponsesReceived = userPolls
                            .SelectMany(p => p.Responses)
                            .Count(r => r.SubmittedDate.Year == date.Year && r.SubmittedDate.Month == date.Month)
                    })
                    .OrderBy(x => DateTime.ParseExact(x.Month, "MMMM yyyy", System.Globalization.CultureInfo.InvariantCulture))
                    .ToList()
            };

            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anket özet istatistikleri alınırken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Anket Aktif-Pasif
    [HttpDelete("toogle/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TogglePoll(int id)
    {
        try
        {
            var poll = await _context.Polls
                .FirstOrDefaultAsync(p => p.Id == id);

            if (poll == null)
            {
                return NotFound("Anket bulunamadı.");
            }

            // Kullanıcı kimliğini al
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı.");
            }

            if (!Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return Unauthorized("Geçersiz kullanıcı kimliği.");
            }

            // Anketi oluşturan kişi mi kontrol et
            if (Guid.TryParse(poll.CreatedByUserId, out Guid creatorId) && creatorId != userId)
            {
                return Forbid("Bu anketi pasifleştirmeye yetkiniz yok.");
            }

            // Anketi pasife çek
            poll.IsActive = !poll.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Anket başarıyla pasifleştirildi." });
        }
        catch (Exception ex)
        {
            // Hata detaylarını loglayabilirsiniz
            return StatusCode(500, $"Anket pasifleştirilirken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Anket Listeleme
    // Anket detaylarını getiren metot
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPollById(int id)
    {
        try
        {
            var poll = await _context.Polls
                .Include(s => s.Questions!.OrderBy(q => q.OrderIndex))
                .ThenInclude(q => q.Options!.OrderBy(o => o.OrderIndex))
                .Select(s => new PollDetailDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    CreatedDate = s.CreatedDate,
                    ExpiryDate = s.ExpiryDate,
                    IsActive = s.IsActive,
                    CategoryId = s.CategoryId,
                    NewCategoryName = s.Category.Name,
                    Questions = s.Questions != null
                        ? s.Questions.Select(q => new QuestionDetailDto
                        {
                            Id = q.Id,
                            Text = q.Text,
                            Type = q.Type,
                            OrderIndex = q.OrderIndex,
                            IsRequired = q.IsRequired,
                            MaxSelections = q.MaxSelections,
                            Options = q.Options != null
                                ? q.Options.Select(o => new OptionDetailDto
                                {
                                    Id = o.Id,
                                    Text = o.Text,
                                    OrderIndex = o.OrderIndex
                                }).ToList()
                                : new List<OptionDetailDto>()
                        }).ToList()
                        : new List<QuestionDetailDto>()
                })
                .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

            if (poll == null)
            {
                return NotFound("Anket bulunamadı veya aktif değil.");
            }

            return Ok(poll);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anket bilgileri alınırken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Anket Cevaplama
    // Kullanıcının ankete yanıt vermesi için metot
    [HttpPost("submit/{pollId}")]
    public async Task<IActionResult> SubmitPollResponse(int pollId, [FromBody] PollResponseDto responseDto)
    {
        try
        {
            var poll = await _context.Polls.FirstOrDefaultAsync(s => s.Id == pollId && s.IsActive);

            if (poll == null)
            {
                return NotFound("Anket bulunamadı veya aktif değil.");
            }

            // Anketin süresi dolmuş mu kontrol et
            if (poll.ExpiryDate.HasValue && poll.ExpiryDate < DateTime.UtcNow)
            {
                return BadRequest("Bu anket için yanıt süresi dolmuştur.");
            }

            Guid? userId = null;
            string sessionId = null;

            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                // Giriş yapmış kullanıcı için
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null)
                {
                    userId = Guid.Parse(userIdClaim.Value);

                    // Giriş yapmış kullanıcı için sadece userId kontrolü yapılıyor
                    bool hasSubmitted = await _context.Responses
                        .AnyAsync(r => r.PollId == pollId && r.UserId == userId.ToString());

                    if (hasSubmitted)
                    {
                        return BadRequest("Bu anketi daha önce yanıtladınız.");
                    }
                }
            }
            else
            {
                // Anonim kullanıcı işlemi
                Request.Cookies.TryGetValue("SessionId", out string cookieSessionId);
                sessionId = cookieSessionId;

                if (string.IsNullOrEmpty(sessionId))
                {
                    sessionId = Guid.NewGuid().ToString();
                    Response.Cookies.Append("SessionId", sessionId, new CookieOptions { Expires = DateTime.Now.AddMonths(1), HttpOnly = true });
                }

                bool hasSubmitted = await _context.Responses
                    .AnyAsync(r => r.PollId == pollId && r.SessionId == sessionId);

                if (hasSubmitted)
                {
                    return BadRequest("Bu anketi daha önce yanıtladınız.");
                }
            }

            // Yeni Response oluşturuluyor
            var response = new Response
            {
                PollId = pollId,
                UserId = userId?.ToString(),  // Kullanıcı ID'si varsa kullan
                SessionId = sessionId,        // Anonim kullanıcı için sessionId kullan
                SubmittedDate = DateTime.UtcNow,
                Answers = new List<Answer>()
            };

            // Yanıtları işleme
            if (responseDto.Answers != null)
            {
                foreach (var answerDto in responseDto.Answers)
                {
                    var question = await _context.Questions.FindAsync(answerDto.QuestionId);
                    if (question == null || question.PollId != pollId)
                    {
                        return BadRequest($"Geçersiz soru ID: {answerDto.QuestionId}");
                    }

                    var answer = new Answer
                    {
                        QuestionId = answerDto.QuestionId,
                        TextAnswer = answerDto.TextAnswer,
                        SelectedOptions = new List<SelectedOption>()
                    };

                    // Seçenekli soruların işlenmesi
                    if (answerDto.SelectedOptionIds != null && answerDto.SelectedOptionIds.Any())
                    {
                        foreach (var optionData in answerDto.SelectedOptionIds)
                        {
                            int optionId = optionData.Key;
                            int? rankOrder = optionData.Value;

                            var option = await _context.Options
                                .FirstOrDefaultAsync(o => o.Id == optionId && o.QuestionId == answerDto.QuestionId);

                            if (option == null)
                            {
                                return BadRequest($"Geçersiz seçenek ID: {optionId}");
                            }

                            answer.SelectedOptions.Add(new SelectedOption
                            {
                                OptionId = optionId,
                                RankOrder = rankOrder
                            });
                        }

                        // Sıralama sorusu için kontrol
                        if (question.Type == QuestionType.Ranking && question.MaxSelections.HasValue)
                        {
                            int selectedCount = answerDto.SelectedOptionIds.Count;
                            if (selectedCount != question.MaxSelections.Value)
                            {
                                return BadRequest($"Sıralama sorusu için {question.MaxSelections.Value} seçenek seçmeniz gerekmektedir.");
                            }
                        }
                    }

                    response.Answers.Add(answer);
                }
            }

            // Yanıt kaydediliyor
            _context.Responses.Add(response);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Anket yanıtınız başarıyla kaydedildi.", });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anket yanıtı kaydedilirken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Ankete katılım durumu kontrolü
    [HttpGet("check/{pollId}")]
    public async Task<IActionResult> CheckPollParticipation(int pollId)
    {
        try
        {
            Guid? userId = null;
            string sessionId = null;

            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null)
                {
                    userId = Guid.Parse(userIdClaim.Value);
                }
            }
            else
            {
                Request.Cookies.TryGetValue("SessionId", out string cookieSessionId);
                sessionId = cookieSessionId;
            }

            bool hasSubmitted = false;

            if (userId != null)
            {
                hasSubmitted = await _context.Responses
                    .AnyAsync(r => r.PollId == pollId && r.UserId == userId.ToString());
            }
            else if (!string.IsNullOrEmpty(sessionId))
            {
                hasSubmitted = await _context.Responses
                    .AnyAsync(r => r.PollId == pollId && r.SessionId == sessionId);
            }

            return Ok(new { hasSubmitted });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Katılım durumu kontrolü sırasında bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Aktif Anketleri Listeleme
    // Tüm aktif anketleri listeleyen metot
    [HttpGet("active")]
    public async Task<IActionResult> GetActivePolls()
    {
        try
        {
            var activePolls = await _context.Polls
                .Where(s => s.IsActive && (!s.ExpiryDate.HasValue || s.ExpiryDate > DateTime.UtcNow))
                .Select(s => new PollListDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    CreatedDate = s.CreatedDate,
                    ExpiryDate = s.ExpiryDate,
                    CategoryId = s.CategoryId,
                    NewCategoryName = s.Category.Name,
                    QuestionCount = s.Questions != null ? s.Questions.Count : 0,
                    ResponseCount = s.Responses != null ? s.Responses.Count : 0
                })
                .ToListAsync();

            return Ok(activePolls);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anketler listelenirken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region My-Polls
    // Admin için oluşturduğu tüm anketleri listeleyen metot
    [HttpGet("my-polls")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetMyPolls()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı.");
            }

            Guid userId = Guid.Parse(userIdClaim.Value);

            var myPolls = await _context.Polls
                .Where(s => s.CreatedByUserId == userId.ToString())
                .Select(s => new PollListDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    CreatedDate = s.CreatedDate,
                    ExpiryDate = s.ExpiryDate,
                    IsActive = s.IsActive,
                    CategoryId = s.CategoryId,
                    NewCategoryName = s.Category.Name,
                    QuestionCount = s.Questions != null ? s.Questions.Count : 0,
                    ResponseCount = s.Responses != null ? s.Responses.Count : 0
                })
                .ToListAsync();

            return Ok(myPolls);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anketler listelenirken bir hata oluştu: {ex.Message}");
        }
    }
    #endregion

    #region Anket Süresi
    [HttpGet("check-expiration")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CheckPollExpiration()
    {
        try
        {
            var currentTime = DateTime.UtcNow;

            // Süresi dolmuş ve aktif olan anketleri bul
            var expiredPolls = await _context.Polls
                .Where(p => p.IsActive && p.ExpiryDate < currentTime)
                .ToListAsync();

            // Her bir süresi dolmuş anketi pasifleştir
            foreach (var poll in expiredPolls)
            {
                poll.IsActive = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{expiredPolls.Count} adet anketin süresi doldu ve pasifleştirildi.",
                expiredPollCount = expiredPolls.Count
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Anket süresi kontrolünde hata oluştu: {ex.Message}");
        }
    }
    #endregion

}