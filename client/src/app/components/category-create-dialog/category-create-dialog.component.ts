import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { CategoryCreateComponent } from '../category-create/category-create.component';

@Component({
  selector: 'app-category-create-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    CommonModule,
    MatFormField,
    MatLabel,
    CategoryCreateComponent
],
  templateUrl: './category-create-dialog.component.html',
  styleUrl: './category-create-dialog.component.css',
})
export class CategoryCreateDialogComponent {}
