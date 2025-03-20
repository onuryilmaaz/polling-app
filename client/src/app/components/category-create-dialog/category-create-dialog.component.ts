import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CategoryService,
  CategoryCreateDto,
  CategoryUpdateDto,
} from '../../services/category.service';
import { Category } from '../../models/poll.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>Kategori Yönetimi</h2>
    <mat-dialog-content>
      <!-- Kategori Oluşturma Formu -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <form
          (ngSubmit)="onSubmit()"
          #categoryForm="ngForm"
          class="flex flex-col sm:flex-row gap-3"
        >
          <mat-form-field appearance="fill" class="flex-grow">
            <mat-label>Kategori Adı</mat-label>
            <input
              matInput
              name="categoryName"
              [(ngModel)]="newCategory.name"
              required
              #categoryName="ngModel"
              placeholder="Kategori adını girin"
            />
            <mat-error *ngIf="categoryName.invalid"
              >Bu alan zorunludur</mat-error
            >
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="!categoryForm.valid"
            class="sm:self-center"
          >
            <mat-icon class="mr-1">add</mat-icon>
            Oluştur
          </button>
        </form>
      </div>

      <!-- Kategori Listesi -->
      <div class="mt-4">
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white rounded-lg">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-3 text-left text-gray-700">Kategori</th>
                <th class="py-2 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let category of categories"
                class="border-b hover:bg-gray-50 transition-colors"
              >
                <td class="py-2 px-3 text-gray-800 flex items-center">
                  <mat-icon class="text-indigo-500 mr-2">folder</mat-icon>
                  {{ category.name }}
                </td>
                <td class="py-2 px-3 text-right">
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="startEdit(category)"
                    matTooltip="Düzenle"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteCategory(category.id)"
                    matTooltip="Sil"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>

              <!-- Kategori yoksa mesaj -->
              <tr *ngIf="categories.length === 0">
                <td colspan="2" class="py-4 text-center text-gray-500">
                  <mat-icon class="text-gray-400 mb-2" style="font-size: 32px"
                    >folder_off</mat-icon
                  >
                  <p>Henüz kategori bulunmuyor</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Düzenleme Modalı -->
      <div
        *ngIf="editingCategory"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">Kategori Düzenle</h2>
            <button mat-icon-button (click)="cancelEdit()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <mat-form-field appearance="fill" class="w-full mb-4">
            <mat-label>Kategori Adı</mat-label>
            <input matInput [(ngModel)]="editingCategory.name" required />
          </mat-form-field>

          <div class="flex justify-end gap-2">
            <button mat-button (click)="cancelEdit()">İptal</button>
            <button mat-raised-button color="primary" (click)="saveEdit()">
              <mat-icon class="mr-1">save</mat-icon>
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Kapat</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="categories">
        Tamam
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        max-height: 70vh;
        min-height: 300px;
        overflow-y: auto;
      }
    `,
  ],
})
export class CategoryCreateDialogComponent implements OnInit {
  categories: Category[] = [];
  newCategory: CategoryCreateDto = { name: '' };
  editingCategory: Category | null = null;

  constructor(
    public dialogRef: MatDialogRef<CategoryCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private categoryService: CategoryService
  ) {}

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
        this.loadCategories();
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
