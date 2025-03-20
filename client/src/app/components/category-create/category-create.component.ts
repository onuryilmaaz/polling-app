import { Component, OnInit } from '@angular/core';
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
import Swal from 'sweetalert2';

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
  ],
  templateUrl: './category-create.component.html',
  styleUrls: ['./category-create.component.css'],
})
export class CategoryCreateComponent implements OnInit {
  // Category tipinden CategoryListDto tipine değiştiriyoruz
  categories: Category[] = [];
  newCategory: CategoryCreateDto = { name: '' };
  editingCategory: Category | null = null;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.map((item) => ({
          id: Number(item.id),
          name: item.name,
        }));
      },
      error: () => this.showError('Kategoriler yüklenemedi'),
    });
  }

  onSubmit(): void {
    this.categoryService.createCategory(this.newCategory).subscribe({
      next: (createdCategory) => {
        this.categories.push({
          id: Number(createdCategory.id),
          name: createdCategory.name,
        });
        this.showSuccess('Kategori başarıyla oluşturuldu');
        this.newCategory = { name: '' };
      },
      error: () => this.showError('Kategori oluşturma başarısız'),
    });
  }

  deleteCategory(id: number): void {
    Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu kategoriyi silmek istediğinize emin misiniz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Evet, sil',
      cancelButtonText: 'İptal',
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(id).subscribe({
          next: () => {
            this.categories = this.categories.filter((c) => c.id !== id);
            this.showSuccess('Kategori başarıyla silindi');
          },
          error: () => this.showError('Silme işlemi başarısız'),
        });
      }
    });
  }

  startEdit(category: Category): void {
    this.editingCategory = { ...category };
  }

  saveEdit(): void {
    if (this.editingCategory) {
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
              this.categories[index] = {
                id: Number(updatedCategory.id),
                name: updatedCategory.name,
              };
            }
            this.editingCategory = null;
            this.showSuccess('Kategori başarıyla güncellendi');
          },
          error: () => this.showError('Güncelleme başarısız'),
        });
    }
  }

  cancelEdit(): void {
    this.editingCategory = null;
  }

  private showSuccess(message: string): void {
    Swal.fire({
      title: 'Başarılı!',
      text: message,
      icon: 'success',
      timer: 1500,
    });
  }

  private showError(message: string): void {
    Swal.fire({
      title: 'Hata!',
      text: message || 'Bir hata oluştu.',
      icon: 'error',
      timer: 1500,
    });
  }
}
