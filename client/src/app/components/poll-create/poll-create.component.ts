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
    this.form = this.fb.group({
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
      createdDate: ['', Validators.required],
      expiryDate: ['', Validators.required],
      questionText: ['', Validators.required],
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
      orderIndex: this.poll.questions[questionIndex].options?.length ?? 0,
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
    // Form geçerli mi kontrolü
    if (this.form.invalid) {
      // Tüm kontrolleri dokunulmuş olarak işaretle, böylece hatalar gösterilir
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });
      return;
    }

    // Tarih dönüşümleri
    if (this.poll.createdDate) {
      this.poll.createdDate = new Date(this.poll.createdDate);
    }

    if (this.poll.expiryDate) {
      this.poll.expiryDate = new Date(this.poll.expiryDate);
    }

    // Soruları işle
    this.poll.questions.forEach((question) => {
      // Type alanını sayısal değere dönüştür
      question.type = Number(question.type);

      // Seçenekleri işle
      if (question.options && question.options.length > 0) {
        let hasEmptyOptions = false;

        question.options.forEach((option, index) => {
          // Boş seçenek kontrolü
          if (!option.text || option.text.trim() === '') {
            option.text = `Seçenek ${index + 1}`; // Varsayılan değer
            hasEmptyOptions = true;
          }

          // OrderIndex değerini sayısal olarak ayarla
          option.orderIndex = index;
        });

        // Boş seçenek uyarısı
        if (hasEmptyOptions) {
          console.warn('Bazı seçenekler boş. Varsayılan değerler atandı.');
        }
      }
    });

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
        console.error('Hata:', err);
        Swal.fire({
          title: 'Hata!',
          text: err.error?.message || 'Bir hata oluştu.',
          icon: 'error',
          confirmButtonText: 'Kapat',
        });
      },
    });
  }
}
