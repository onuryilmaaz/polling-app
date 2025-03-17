using api.Data;
using api.Dtos;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        #region Kategori Listeleme
        [HttpGet("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.PollCategories
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();

            return Ok(categories);
        }
        #endregion

        #region Kategori Oluşturma
        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryCreateDto dto)
        {
            // Validasyon kontrolü
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kategori ismi benzersiz mi kontrol et
            var existingCategory = await _context.PollCategories
                .FirstOrDefaultAsync(c => c.Name == dto.Name);

            if (existingCategory != null)
                return BadRequest("Bu kategori zaten mevcut.");


            // Yeni kategoriyi oluştur
            var newCategory = new PollCategory
            {
                Name = dto.Name.Trim()
            };

            _context.PollCategories.Add(newCategory);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategories), new { id = newCategory.Id }, newCategory);
        }
        #endregion

        #region Kategori Güncelleme
        [HttpPut("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryUpdateDto dto)
        {
            // Validasyon kontrolü
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Kategoriyi bul
            var category = await _context.PollCategories.FindAsync(id);

            if (category == null)
                return NotFound("Kategori bulunamadı.");

            // İsim değiştiyse benzersizlik kontrolü
            if (category.Name != dto.Name.Trim())
            {
                var existingCategory = await _context.PollCategories
                    .FirstOrDefaultAsync(c => c.Name == dto.Name);

                if (existingCategory != null)
                    return BadRequest("Bu isimde başka bir kategori mevcut.");
            }

            // Güncellemeyi uygula
            category.Name = dto.Name.Trim();
            await _context.SaveChangesAsync();

            return Ok(category);
        }
        #endregion

        #region Kategori Silme
        [HttpDelete("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            // Kategoriyi bul
            var category = await _context.PollCategories.FindAsync(id);

            if (category == null)
                return NotFound("Kategori bulunamadı.");

            // İlişkili anket kontrolü
            var hasPolls = await _context.Polls.AnyAsync(p => p.CategoryId == id);

            if (hasPolls)
                return BadRequest("Bu kategoriye ait anketler olduğu için silinemez.");

            // Silme işlemi
            _context.PollCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        #endregion

    }
}
