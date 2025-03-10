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
} from '@angular/forms';

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
  poll: PollCreateDto = {
    title: '',
    description: '',
    createdDate: undefined,
    expiryDate: undefined,
    isActive: true,
    questions: [],
  };
  form!: FormGroup;
  fb = inject(FormBuilder);

  constructor(private pollService: PollService, private router: Router) {}

  ngOnInit(): void {
    // this.form = this.fb.group({
    //   title: [
    //     '',
    //     [
    //       Validators.required,
    //       Validators.minLength(5),
    //       Validators.maxLength(30),
    //     ],
    //   ],
    //   description: [
    //     '',
    //     [
    //       Validators.required,
    //       Validators.minLength(10),
    //       Validators.maxLength(100),
    //     ],
    //   ],
    //   createdDate: ['', [Validators.required]],
    //   expiryDate: ['', [Validators.required]],
    //   questions: [[], [Validators.required, Validators.minLength(1)]],
    //   questionText: ['', [Validators.required]],
    //   optionText: ['', [Validators.required]],
    // });

    this.form = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(30),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(100),
        ],
      ],
      createdDate: ['', Validators.required],
      expiryDate: ['', Validators.required],
      questionText: ['', [Validators.required]],
      // questions: this.fb.array(
      //   [],
      //   [Validators.required, Validators.minLength(1)]
      // ), // FormArray yapısı
    });
  }

  // Yeni soru ekleme
  addQuestion(): void {
    this.poll.questions.push({
      text: '',
      type: QuestionType.YesNo,
      orderIndex: this.poll.questions.length,
      isRequired: false,
      maxSelections: undefined,
      options: [],
    });
  }

  // Soruya yeni seçenek ekleme
  addOption(questionIndex: number): void {
    this.poll.questions[questionIndex].options?.push({
      text: '',
      orderIndex: this.poll.questions[questionIndex].options.length,
    });
  }

  // Soru silme metodu
  removeQuestion(index: number): void {
    // İlgili indeksteki soruyu kaldır
    this.poll.questions.splice(index, 1);
    // Kalan soruların orderIndex değerlerini güncelle
    this.poll.questions.forEach((q, i) => (q.orderIndex = i));
  }

  // Seçenek silme metodu
  removeOption(questionIndex: number, optionIndex: number): void {
    // İlgili sorunun options dizisinden, belirli index'teki seçeneği kaldır
    this.poll.questions[questionIndex].options?.splice(optionIndex, 1);
    // Kalan seçeneklerin orderIndex değerlerini güncelle
    this.poll.questions[questionIndex].options?.forEach(
      (option, i) => (option.orderIndex = i)
    );
  }

  onSubmit(): void {
    if (this.poll.createdDate) {
      this.poll.createdDate = new Date(this.poll.createdDate); // Date nesnesi olarak tut
    }

    if (this.poll.expiryDate) {
      this.poll.expiryDate = new Date(this.poll.expiryDate); // Date nesnesi olarak tut
    }

    // type alanını sayısal değere dönüştür
    this.poll.questions.forEach((question) => {
      question.type = Number(question.type); // String'i sayıya dönüştür
    });

    // API isteği gönder
    this.pollService.createPoll(this.poll).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Başarılı!',
          text: response.message,
          icon: 'success',
          timer: 1000,
        });
        this.router.navigate(['/poll-list']);
      },
      error: (err) => {
        if (err.error && err.error.errors) {
          console.log('Validation Errors:', err.error.errors);
        }
        Swal.fire({
          title: 'Hata!',
          text: err.error.message,
          icon: 'error',
          confirmButtonText: 'Kapat',
        });
      },
    });
  }
}
