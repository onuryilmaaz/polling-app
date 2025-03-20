// src/app/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

// Interface'ler
export interface Category {
  id: string;
  name: string;
}

export interface CategoryCreateDto {
  name: string;
}

export interface CategoryUpdateDto {
  name: string;
}
export interface CategoryListDto {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}`; // API base URL'i
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`, // JWT Token
  });

  constructor(private http: HttpClient) {}

  // Tüm kategorileri getir
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}Category/categories`).pipe(
      catchError((error) => {
        console.error('Kategoriler yüklenirken hata:', error);
        throw error;
      })
    );
  }
  
  // Yeni kategori oluştur
  createCategory(dto: CategoryCreateDto): Observable<Category> {
    return this.http
      .post<Category>(`${this.apiUrl}Category/categories`, dto, {
        headers: this.headers,
      })
      .pipe(
        catchError((error) => {
          console.error('Kategori oluşturma hatası:', error);
          throw error;
        })
      );
  }

  // Kategori güncelle
  updateCategory(id: number, dto: CategoryUpdateDto): Observable<Category> {
    return this.http
      .put<Category>(`${this.apiUrl}Category/categories/${id}`, dto, {
        headers: this.headers,
      })
      .pipe(
        catchError((error) => {
          console.error('Kategori güncelleme hatası:', error);
          throw error;
        })
      );
  }

  // Kategori sil
  deleteCategory(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}Category/categories/${id}`, {
        headers: this.headers,
      })
      .pipe(
        catchError((error) => {
          console.error('Kategori silme hatası:', error);
          throw error;
        })
      );
  }
}
