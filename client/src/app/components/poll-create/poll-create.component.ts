import { Component, inject, OnInit } from '@angular/core';
import { PollService } from '../../services/poll.service';
import { Router } from '@angular/router';
import { PollCreateDto, QuestionType } from '../../models/poll.models';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import Swal from 'sweetalert2';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  FormArray,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-poll-create',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatIconModule,
    MatSelectModule,
    MatNativeDateModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
  ],
  templateUrl: './poll-create.component.html',
  styleUrls: ['./poll-create.component.css'],
})
export class PollCreateComponent implements OnInit {
  pollForm!: FormGroup;
  fb = inject(FormBuilder);
  categories: any[] = []; // Holds loaded categories
  loading = false;

  constructor(
    private pollService: PollService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  private atLeastOneCheckboxCheckedValidator(minRequired = 1): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      if (!(formArray instanceof FormArray)) return null;
      const totalChecked = formArray.controls
        .map((control) => control.value)
        .reduce((prev, next) => (next ? prev + 1 : prev), 0);
      return totalChecked >= minRequired ? null : { required: true };
    };
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        // Initialize categories FormArray with checkboxes
        const categoryFormArray = this.fb.array(
          data.map(() => this.fb.control(false)),
          { validators: this.atLeastOneCheckboxCheckedValidator(1) }
        );
        this.pollForm.setControl('categories', categoryFormArray);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
      },
    });
  }

  initForm(): void {
    this.pollForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(50),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(1000),
        ],
      ],
      createdDate: [null, Validators.required],
      expiryDate: [null, Validators.required],
      isActive: [true],
      questions: this.fb.array([]),
    });
  }

  // Get questions as FormArray
  get questions(): FormArray {
    return this.pollForm.get('questions') as FormArray;
  }

  // Get options for a specific question
  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  // Add new question
  addQuestion(): void {
    const questionGroup = this.fb.group({
      text: ['', Validators.required],
      type: [QuestionType.YesNo],
      orderIndex: [this.questions.length],
      isRequired: [false],
      maxSelections: [null],
      options: this.fb.array([]),
    });

    this.questions.push(questionGroup);
  }

  // Add new option to a question
  addOption(questionIndex: number): void {
    const optionGroup = this.fb.group({
      text: ['', Validators.required],
      orderIndex: [this.getOptions(questionIndex).length],
    });

    this.getOptions(questionIndex).push(optionGroup);
  }

  // Remove question
  removeQuestion(index: number): void {
    this.questions.removeAt(index);

    // Update orderIndex for remaining questions
    this.questions.controls.forEach((control, i) => {
      control.get('orderIndex')?.setValue(i);
    });
  }

  // Remove option
  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.removeAt(optionIndex);

    // Update orderIndex for remaining options
    options.controls.forEach((control, i) => {
      control.get('orderIndex')?.setValue(i);
    });
  }

  // onSubmit(): void {
  //   // Check if form is valid
  //   if (this.pollForm.invalid) {
  //     this.markFormGroupTouched(this.pollForm);
  //     return;
  //   }

  //   const formValue = this.pollForm.getRawValue();
  //   const poll: PollCreateDto = {
  //     title: formValue.title,
  //     description: formValue.description,
  //     createdDate: formValue.createdDate
  //       ? new Date(formValue.createdDate)
  //       : undefined,
  //     expiryDate: formValue.expiryDate
  //       ? new Date(formValue.expiryDate)
  //       : undefined,
  //     isActive: formValue.isActive,
  //     categoryId: formValue.categoryId,
  //     categoryName: formValue.newCategoryName,
  //     questions: formValue.questions.map((q: any, index: number) => {
  //       return {
  //         ...q,
  //         type: Number(q.type),
  //         orderIndex: index,
  //         options: q.options.map((opt: any, optIndex: number) => {
  //           if (!opt.text || opt.text.trim() === '') {
  //             opt.text = `Seçenek ${optIndex + 1}`;
  //             console.warn('Bazı seçenekler boş. Varsayılan değerler atandı.');
  //           }
  //           return {
  //             ...opt,
  //             orderIndex: optIndex,
  //           };
  //         }),
  //       };
  //     }),
  //   };

  //   this.pollService.createPoll(poll).subscribe({
  //     next: (response) => {
  //       Swal.fire({
  //         title: 'Başarılı!',
  //         text: response.message,
  //         icon: 'success',
  //         timer: 1000,
  //       });
  //       this.router.navigate(['/poll-list']);
  //     },
  //     error: (err) => {
  //       console.error('Hata:', err);
  //       Swal.fire({
  //         title: 'Hata!',
  //         text: err.error?.message || 'Bir hata oluştu.',
  //         icon: 'error',
  //         confirmButtonText: 'Kapat',
  //       });
  //     },
  //   });
  // }

  // Helper method to mark all controls in a form group as touched

  onSubmit(): void {
    if (this.pollForm.invalid) {
      this.markFormGroupTouched(this.pollForm);
      return;
    }

    const formValue = this.pollForm.getRawValue();
    // Extract selected category IDs
    const selectedCategoryIds = formValue.categories
      .map((checked: boolean, index: number) =>
        checked ? this.categories[index].id : null
      )
      .filter((id: number | null) => id !== null);

    const poll: PollCreateDto = {
      title: formValue.title,
      description: formValue.description,
      createdDate: formValue.createdDate
        ? new Date(formValue.createdDate)
        : undefined,
      expiryDate: formValue.expiryDate
        ? new Date(formValue.expiryDate)
        : undefined,
      isActive: formValue.isActive,
      categoryId:
        selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null, // Include category IDs
      questions: formValue.questions.map((q: any, index: number) => ({
        ...q,
        type: Number(q.type),
        orderIndex: index,
        options: q.options.map((opt: any, optIndex: number) => ({
          text: opt.text || `Seçenek ${optIndex + 1}`,
          orderIndex: optIndex,
        })),
      })),
    };
    console.log(formValue);

    this.pollService.createPoll(poll).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Success!',
          text: response.message,
          icon: 'success',
          timer: 1000,
        });
        this.router.navigate(['/poll-list']);
      },
      error: (err) => {
        Swal.fire({
          title: 'Error!',
          text: err.error?.message || 'An error occurred.',
          icon: 'error',
        });
      },
    });
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else if (control instanceof AbstractControl) {
        control.markAsTouched();
      }
    });
  }

  // Helper to check if a specific question allows options
  allowsOptions(type: string | number): boolean {
    const numType = Number(type);
    return numType !== 1 && numType !== 2; // Text (1) and YesNo (2) don't have options
  }

  // Helper to check if a specific question needs maxSelections
  needsMaxSelections(type: string | number): boolean {
    return Number(type) === 4; // Only for Ranking (4)
  }
}
