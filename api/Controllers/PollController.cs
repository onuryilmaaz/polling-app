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
        try
        {
            // Giriş yapmış kullanıcının ID'sini al
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Kullanıcı kimliği bulunamadı.");
            }

            Guid userId = Guid.Parse(userIdClaim.Value);

            // Yeni anket oluştur
            var poll = new Poll
            {
                Title = pollDto.Title ?? string.Empty,
                Description = pollDto.Description,
                CreatedDate = pollDto.CreatedDate,
                ExpiryDate = pollDto.ExpiryDate,
                IsActive = pollDto.IsActive,
                CreatedByUserId = userId.ToString(),
                Questions = new List<Question>()
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
                        MaxSelections = questionDto.Type == QuestionType.YesNo
                                ? 1
                                : questionDto.MaxSelections ?? 0,
                        Options = new List<Option>()
                    };

                    // // Eğer soru Yes/No tipi ise, otomatik olarak seçenekleri ekle
                    // if (question.Type == QuestionType.YesNo)
                    // {
                    //     // Otomatik seçenekleri düzgün order index ile ekle
                    //     question.Options.Add(new Option
                    //     {
                    //         Text = "Evet",
                    //         OrderIndex = 1 // ← Sıralama için önemli
                    //     });
                    //     question.Options.Add(new Option
                    //     {
                    //         Text = "Hayır",
                    //         OrderIndex = 2
                    //     });

                    //     // YesNo sorularında kullanıcının seçenek eklemesini engelle
                    //     //questionDto.Options = null; // ← Frontend'den gelse bile ignore et
                    // }

                    // Eğer soru Yes/No tipi ise, seçenekleri ekle (kullanıcı özelleştirmesine izin vererek)
                    if (question.Type == QuestionType.YesNo)
                    {
                        // Frontend'den gelen seçenekleri kontrol et
                        bool hasCustomOptions = question.Options != null && question.Options.Count >= 2;

                        // Eğer kullanıcı özel seçenek metinleri girmediyse, varsayılanları kullan
                        if (!hasCustomOptions)
                        {
                            // Kullanıcı hiç seçenek girmemişse veya yetersiz seçenek girmişse
                            question.Options = new List<Option>
        {
            new Option
            {
                Text = "Evet",
                OrderIndex = 1
            },
            new Option
            {
                Text = "Hayır",
                OrderIndex = 2
            }
        };
                        }
                        else
                        {
                            // Kullanıcının girdiği özel seçenekleri koru
                            // Sadece OrderIndex'leri düzgün olduğundan emin ol
                            for (int i = 0; i < question.Options.Count; i++)
                            {
                                question.Options[i].OrderIndex = i + 1;
                            }
                        }
                    }

                    // Kullanıcının belirttiği seçenekleri ekle
                    else if (questionDto.Options != null && questionDto.Options.Any())
                    {
                        foreach (var optionDto in questionDto.Options)
                        {
                            question.Options.Add(new Option
                            {
                                Text = optionDto.Text ?? string.Empty,
                                OrderIndex = optionDto.OrderIndex
                            });
                        }
                    }

                    poll.Questions.Add(question);
                }
            }

            _context.Polls.Add(poll);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPollById), new { id = poll.Id },
            new
            {
                id = poll.Id,
                questions = poll.Questions.Select(q => new
                {
                    q.Id,
                    options = q.Options.Select(o => new { o.Id, o.Text }) // ← Seçenek ID'leri
                }),
                message = "Anket başarıyla oluşturuldu."
            });
        }
        catch (Exception ex)
        {
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
                // Önce cevapları sil
                _context.Answers.RemoveRange(question.Answers);

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
                    MaxSelections = questionDto.Type == QuestionType.MultipleChoice ||
                                  questionDto.Type == QuestionType.Ranking
                                  ? questionDto.MaxSelections
                                  : null,
                    Options = new List<Option>()
                };

                if (question.Type == QuestionType.YesNo)
                {
                    question.Options.Add(new Option { Text = "Evet", OrderIndex = 0 });
                    question.Options.Add(new Option { Text = "Hayır", OrderIndex = 1 });
                    questionDto.Options = null; // Frontend'den gelse bile ignore et
                }
                else if (questionDto.Options != null)
                {
                    foreach (var optionDto in questionDto.Options)
                    {
                        question.Options.Add(new Option
                        {
                            Text = optionDto.Text ?? string.Empty,
                            OrderIndex = optionDto.OrderIndex
                        });
                    }
                }

                poll.Questions.Add(question);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { message = "Anket başarıyla güncellendi." });
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

            if (User.Identity == null || !User.Identity.IsAuthenticated)
            {
                // Anonim kullanıcı işlemi
                Request.Cookies.TryGetValue("PollSessionId", out string cookieSessionId);
                sessionId = cookieSessionId;

                if (string.IsNullOrEmpty(sessionId))
                {
                    sessionId = Guid.NewGuid().ToString();
                    Response.Cookies.Append("PollSessionId", sessionId, new CookieOptions { Expires = DateTime.Now.AddMonths(1), HttpOnly = true });
                }

                bool hasSubmitted = await _context.Responses
                    .AnyAsync(r => r.PollId == pollId && r.SessionId == sessionId);

                if (hasSubmitted)
                {
                    return BadRequest("Bu anketi daha önce yanıtladınız.");
                }
            }
            else
            {
                // Giriş yapmış kullanıcı için
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim != null)
                {
                    userId = Guid.Parse(userIdClaim.Value);
                }
                else
                {
                    // Kullanıcı kimliği yoksa oturum kimliğini kullan
                    Request.Cookies.TryGetValue("PollSessionId", out string cookieSessionId);
                    sessionId = cookieSessionId;

                    if (string.IsNullOrEmpty(sessionId))
                    {
                        sessionId = Guid.NewGuid().ToString();
                        Response.Cookies.Append("PollSessionId", sessionId, new CookieOptions { Expires = DateTime.Now.AddMonths(1), HttpOnly = true });
                    }
                }

                bool hasSubmitted = await _context.Responses
                    .AnyAsync(r => r.PollId == pollId && (r.UserId == userId.ToString() || r.SessionId == sessionId));

                if (hasSubmitted)
                {
                    return BadRequest("Bu anketi daha önce yanıtladınız.");
                }
            }

            // Yeni Response oluşturuluyor
            var response = new Response
            {
                PollId = pollId,
                UserId = userId?.ToString(),  // Kullanıcı ID'si varsa, varsa kullan
                SessionId = sessionId,
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