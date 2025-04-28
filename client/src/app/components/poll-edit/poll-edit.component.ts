import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PollService } from '../../services/poll.service';
import {
  PollUpdateDto,
  PollDetailDto,
  QuestionType,
} from '../../models/poll.models';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  FormArray,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-poll-edit',
  standalone: true,
  imports: [
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
  ],
  templateUrl: './poll-edit.component.html',
  styleUrls: ['./poll-edit.component.css'],
})
export class PollEditComponent implements OnInit {
  pollId: number | null = null;
  pollForm!: FormGroup;
  fb = inject(FormBuilder);
  questionTypes = [
    { value: 0, label: 'Tek Seçim' },
    { value: 1, label: 'Metin' },
    { value: 2, label: 'Doğru Yanlış' },
    { value: 3, label: 'Çoklu Seçim' },
    { value: 4, label: 'Sıralama' },
  ];

  constructor(
    private pollService: PollService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Get the poll ID from the route
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.pollId = +idParam; // Convert to number
        this.loadPollDetails();
      }
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
      expiryDate: ['', Validators.required],
      isActive: [true],
      questions: this.fb.array([]),
    });
  }

  // Get questions as FormArray
  get questions(): FormArray {
    return this.pollForm.get('questions') as FormArray;
  }

  // Create a question form group
  createQuestionGroup(question: any = null): FormGroup {
    const formGroup = this.fb.group({
      id: [question?.id || null],
      text: [question?.text || '', Validators.required],
      type: [
        question?.type || QuestionType.MultipleChoice,
        Validators.required,
      ],
      orderIndex: [question?.orderIndex || 0],
      isRequired: [question?.isRequired || false],
      maxSelections: [question?.maxSelections || null],
      options: this.fb.array([]),
    });

    // Add options if they exist
    if (question?.options && question.options.length > 0) {
      const optionsArray = formGroup.get('options') as FormArray;
      question.options.forEach((option: any) => {
        optionsArray.push(this.createOptionGroup(option));
      });
    }

    return formGroup;
  }

  // Create an option form group
  createOptionGroup(option: any = null): FormGroup {
    return this.fb.group({
      id: [option?.id || null],
      text: [option?.text || '', Validators.required],
      orderIndex: [option?.orderIndex || 0],
    });
  }

  // Get options for a specific question
  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  // Load poll details for editing
  loadPollDetails(): void {
    if (this.pollId) {
      this.pollService.getPollById(this.pollId).subscribe({
        next: (pollDetail: PollDetailDto) => {
          // Reset form with new data
          this.pollForm.patchValue({
            title: pollDetail.title,
            description: pollDetail.description || '',
            expiryDate: pollDetail.expiryDate
              ? new Date(pollDetail.expiryDate)
              : null,
            isActive: pollDetail.isActive,
          });

          // Clear questions array and add each question
          this.questions.clear();
          pollDetail.questions.forEach((question) => {
            this.questions.push(this.createQuestionGroup(question));
          });
        },
        error: (err) => {
          console.error('Anket yüklenirken hata oluştu:', err);
          Swal.fire({
            title: 'Hata!',
            text: 'Anket yüklenemedi: ' + err.message,
            icon: 'error',
            confirmButtonText: 'Kapat',
          });
          this.router.navigate(['/poll-list']);
        },
      });
    }
  }

  // Add a new question
  addQuestion(): void {
    this.questions.push(
      this.createQuestionGroup({
        text: '',
        type: QuestionType.YesNo,
        orderIndex: this.questions.length,
        isRequired: false,
        options: [],
      })
    );
  }

  // Add a new option to a question
  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.push(
      this.createOptionGroup({
        text: '',
        orderIndex: options.length,
      })
    );
  }

  // Remove a question
  removeQuestion(index: number): void {
    this.questions.removeAt(index);

    // Update orderIndex for remaining questions
    for (let i = 0; i < this.questions.length; i++) {
      this.questions.at(i).get('orderIndex')?.setValue(i);
    }
  }

  // Remove an option
  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.removeAt(optionIndex);

    // Update orderIndex for remaining options
    for (let i = 0; i < options.length; i++) {
      options.at(i).get('orderIndex')?.setValue(i);
    }
  }

  // Whether to show options for a question type
  shouldShowOptions(type: number): boolean {
    return type === 0 || type === 3 || type === 4;
  }

  // Whether to show maxSelections for a question type
  shouldShowMaxSelections(type: number): boolean {
    return type === 4;
  }

  onSubmit(): void {
    if (!this.pollId || this.pollForm.invalid) {
      Swal.fire({
        title: 'Hata!',
        text: this.pollId
          ? 'Form geçersiz. Lütfen tüm alanları kontrol edin.'
          : 'Anket Bulunamadı',
        icon: 'error',
        confirmButtonText: 'Kapat',
      });
      return;
    }

    const formValue = this.pollForm.value;

    // Prepare the payload
    const payload: PollUpdateDto = {
      title: formValue.title,
      description: formValue.description,
      expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : null,
      isActive: formValue.isActive,
      questions: [],
    };

    // Process each question based on its type
    formValue.questions.forEach((question: any) => {
      const questionType = Number(question.type);
      let processedQuestion: any = {
        id: question.id,
        text: question.text,
        type: questionType,
        orderIndex: question.orderIndex,
        isRequired: question.isRequired,
      };

      // Add type-specific properties
      if (this.shouldShowOptions(questionType)) {
        processedQuestion.options = question.options;
      }

      if (this.shouldShowMaxSelections(questionType)) {
        processedQuestion.maxSelections = question.maxSelections;
      }

      payload.questions.push(processedQuestion);
    });

    this.pollService.updatePoll(this.pollId, payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Başarılı!',
          text: response.message,
          icon: 'success',
          timer: 1000,
        });
        console.log(response);
        this.router.navigate(['/poll-list']);
      },
      error: (err) => {
        if (err.error && err.error.errors) {
          console.log('Validation Errors:', err.error.errors);
        }
        Swal.fire({
          title: 'Hata!',
          text: err.error.message || 'Bir hata oluştu',
          icon: 'error',
          confirmButtonText: 'Kapat',
        });
      },
    });
  }
}
