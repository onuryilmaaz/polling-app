import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CategoryCreateDto,
  CategoryUpdateDto,
  CategoryService,
} from '../../services/category.service';
import { Category } from '../../models/poll.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './category-create.component.html',
  styleUrls: ['./category-create.component.css'],
})
export class CategoryCreateComponent implements OnInit {
  // Category tipinden CategoryListDto tipine değiştiriyoruz
  categories: Category[] = [];
  newCategory: CategoryCreateDto = { name: '' };
  editingCategory: Category | null = null;

  constructor(
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        // Category ile CategoryListDto arasında tip dönüşümü yapıyoruz
        this.categories = data.map((item) => ({
          id: Number(item.id), // String ID'yi number'a dönüştürüyoruz
          name: item.name,
        }));
      },
      error: (err) => this.showError('Kategoriler yüklenemedi'),
    });
  }

  onSubmit(): void {
    this.categoryService.createCategory(this.newCategory).subscribe({
      next: (createdCategory) => {
        // CategoryListDto'dan Category'ye dönüştürme
        this.categories.push({
          id: Number(createdCategory.id),
          name: createdCategory.name,
        });
        this.newCategory = { name: '' };
        this.showSuccess('Kategori başarıyla oluşturuldu');
      },
      error: (err) => this.showError('Kategori oluşturma başarısız'),
    });
  }

  deleteCategory(id: number): void {
    if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      // Number ID'yi string'e dönüştürüyoruz
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.categories = this.categories.filter((c) => c.id !== id);
          this.showSuccess('Kategori başarıyla silindi');
        },
        error: (err) => this.showError('Silme işlemi başarısız'),
      });
    }
  }

  startEdit(category: Category): void {
    this.editingCategory = { ...category };
  }

  saveEdit(): void {
    if (this.editingCategory) {
      // CategoryUpdateDto'yu oluşturuyoruz, sadece name ile
      const updateDto: CategoryUpdateDto = {
        name: this.editingCategory.name,
      };

      this.categoryService
        .updateCategory(this.editingCategory.id, updateDto)
        .subscribe({
          next: (updatedCategory) => {
            const index = this.categories.findIndex(
              (c) => c.id === Number(updatedCategory.id)
            );
            if (index > -1) {
              // CategoryListDto'dan Category'ye dönüştürme
              this.categories[index] = {
                id: Number(updatedCategory.id),
                name: updatedCategory.name,
              };
            }
            this.editingCategory = null;
            this.showSuccess('Kategori başarıyla güncellendi');
          },
          error: (err) => this.showError('Güncelleme başarısız'),
        });
    }
  }

  cancelEdit(): void {
    this.editingCategory = null;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Kapat', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Kapat', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }
}
