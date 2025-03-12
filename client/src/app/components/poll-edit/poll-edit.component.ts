import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PollService } from '../../services/poll.service';
import {
  PollUpdateDto,
  PollDetailDto,
  QuestionType,
} from '../../models/poll.models';
import {
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
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
  ],
  templateUrl: './poll-edit.component.html',
  styleUrls: ['./poll-edit.component.css'],
})
export class PollEditComponent implements OnInit {
  pollId: number | null = null;
  poll: PollUpdateDto = {
    title: '',
    description: '',
    expiryDate: undefined,
    isActive: true,
    questions: [],
  };
  form!: FormGroup;
  fb = inject(FormBuilder);

  //formControl
  titleFormControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
    Validators.minLength(5),
  ]);

  constructor(
    private pollService: PollService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get the poll ID from the route
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.pollId = +idParam; // Convert to number
        this.loadPollDetails();
      }
    });
  }

  // Load poll details for editing
  loadPollDetails(): void {
    if (this.pollId) {
      this.pollService.getPollById(this.pollId).subscribe({
        next: (pollDetail: PollDetailDto) => {
          console.log('Loaded poll details:', pollDetail);
          // Map the retrieved poll details to the update DTO
          this.poll = {
            title: pollDetail.title,
            description: pollDetail.description || '',
            expiryDate: pollDetail.expiryDate
              ? new Date(pollDetail.expiryDate)
              : undefined,
            isActive: pollDetail.isActive,
            questions: pollDetail.questions.map((q) => ({
              id: q.id, // Include existing question ID
              text: q.text,
              type: q.type,
              orderIndex: q.orderIndex,
              isRequired: q.isRequired,
              maxSelections: q.maxSelections,
              options: q.options?.map((option) => ({
                id: option.id, // Include existing option ID
                text: option.text,
                orderIndex: option.orderIndex,
              })),
            })),
          };
        },
        error: (err) => {
          console.error('Anket yüklenirken hata oluştu:', err);
          alert('Anket yüklenemedi: ' + err.message);
          this.router.navigate(['/poll-list']);
        },
      });
    }
  }

  // Yeni soru ekleme (var olan poll-create ile aynı)
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

  // onSubmit(): void {
  //   if (!this.pollId) {
  //     Swal.fire({
  //       title: 'Hata!',
  //       text: 'Anket Bulunamadı',
  //       icon: 'error',
  //       confirmButtonText: 'Kapat',
  //     });
  //     return;
  //   }
  //   console.log('Original poll object:', JSON.stringify(this.poll, null, 2));

  //   // Deep copy oluştur ve veriyi formatla
  //   const payload: PollUpdateDto = {
  //     ...this.poll,
  //     expiryDate: this.poll.expiryDate ? new Date(this.poll.expiryDate) : null,
  //     questions: this.poll.questions.map((question) => {
  //       // Soru tipini number'a çevir
  //       const questionType = Number(question.type);

  //       // Temizlenmiş soru objesi
  //       const cleanedQuestion: any = {
  //         id: question.id, // Mevcut ID'yi koru
  //         text: question.text,
  //         type: questionType,
  //         orderIndex: question.orderIndex,
  //         isRequired: question.isRequired,
  //       };

  //       // Sadece ilgili alanları ekle
  //       switch (questionType) {
  //         case QuestionType.MultipleChoice:
  //           delete cleanedQuestion.maxSelections;

  //           // options dizisini doğrudan atama
  //           cleanedQuestion.options =
  //             question.options?.map((option) => ({
  //               id: option.id,
  //               text: option.text,
  //               orderIndex: option.orderIndex,
  //             })) || [];
  //           break;
  //         case QuestionType.Ranking:
  //           cleanedQuestion.maxSelections = question.maxSelections;
  //           cleanedQuestion.options = question.options?.map((option) => ({
  //             id: option.id, // Mevcut ID'yi koru
  //             text: option.text,
  //             orderIndex: option.orderIndex,
  //           }));
  //           break;

  //         case QuestionType.Text:
  //           // Metin sorusunda options ve maxSelections olmamalı
  //           delete cleanedQuestion.maxSelections;
  //           delete cleanedQuestion.options;
  //           break;

  //         case QuestionType.YesNo:
  //           // Doğru/Yanlış sorusunda options gerekli değil
  //           delete cleanedQuestion.options;
  //           break;
  //       }

  //       return cleanedQuestion;
  //     }),
  //   };

  //   console.log('Final payload:', JSON.stringify(payload));

  //   this.pollService.updatePoll(this.pollId, payload).subscribe({
  //     next: (response) => {
  //       Swal.fire({
  //         title: 'Başarılı!',
  //         text: response.message,
  //         icon: 'success',
  //         timer: 1000,
  //       });
  //       this.router.navigate(['/poll-list']);
  //       console.log('Payload:', JSON.stringify(payload, null, 2));
  //     },
  //     error: (err) => {
  //       if (err.error && err.error.errors) {
  //         console.log('Validation Errors:', err.error.errors);
  //       }
  //       Swal.fire({
  //         title: 'Hata!',
  //         text: err.error.message,
  //         icon: 'error',
  //         confirmButtonText: 'Kapat',
  //       });
  //     },
  //   });
  // }

  onSubmit(): void {
    if (!this.pollId) {
      Swal.fire({
        title: 'Hata!',
        text: 'Anket Bulunamadı',
        icon: 'error',
        confirmButtonText: 'Kapat',
      });
      return;
    }

    console.log('Original poll object:', JSON.stringify(this.poll, null, 2));

    // Tipini açıkça tanımlayalım
    const payload: PollUpdateDto = {
      title: this.poll.title,
      description: this.poll.description,
      expiryDate: this.poll.expiryDate ? new Date(this.poll.expiryDate) : null,
      isActive: this.poll.isActive,
      questions: [],
    };

    // Her soruyu işleyelim
    for (const question of this.poll.questions) {
      const questionType = Number(question.type);

      // Soru tipine göre işlem yapalım
      if (questionType === 3) {
        // MultipleChoice
        // Tüm gerekli alanları içeren bir soru nesnesi oluşturalım
        const multipleChoiceQuestion = {
          id: question.id,
          text: question.text,
          type: questionType,
          orderIndex: question.orderIndex,
          isRequired: question.isRequired,
          options:
            question.options?.map((option) => ({
              id: option.id,
              text: option.text,
              orderIndex: option.orderIndex,
            })) || [],
        };

        // Soruyu payload'a ekleyelim
        payload.questions.push(multipleChoiceQuestion);
      } else if (questionType === 4) {
        // Ranking
        // Ranking sorusu için özel nesne
        const rankingQuestion = {
          id: question.id,
          text: question.text,
          type: questionType,
          orderIndex: question.orderIndex,
          isRequired: question.isRequired,
          maxSelections: question.maxSelections,
          options:
            question.options?.map((option) => ({
              id: option.id,
              text: option.text,
              orderIndex: option.orderIndex,
            })) || [],
        };

        // Soruyu payload'a ekleyelim
        payload.questions.push(rankingQuestion);
      } else if (questionType === 1) {
        // Text
        // Text sorusu için özel nesne
        const textQuestion = {
          id: question.id,
          text: question.text,
          type: questionType,
          orderIndex: question.orderIndex,
          isRequired: question.isRequired,
        };

        // Soruyu payload'a ekleyelim
        payload.questions.push(textQuestion);
      } else if (questionType === 2) {
        // YesNo
        // YesNo sorusu için özel nesne
        const yesNoQuestion = {
          id: question.id,
          text: question.text,
          type: questionType,
          orderIndex: question.orderIndex,
          isRequired: question.isRequired,
        };

        // Soruyu payload'a ekleyelim
        payload.questions.push(yesNoQuestion);
      } else if (questionType === 0) {
        // Çoktan seçmeli (tek seçim)
        const yesNoQuestion = {
          id: question.id,
          text: question.text,
          type: questionType,
          orderIndex: question.orderIndex,
          isRequired: question.isRequired,
        };

        // Soruyu payload'a ekleyelim
        payload.questions.push(yesNoQuestion);
      } else {
        // Diğer soru tipleri için basic nesne
        const basicQuestion = {
          id: question.id,
          text: question.text,
          type: questionType,
          orderIndex: question.orderIndex,
          isRequired: question.isRequired,
        };

        // Soruyu payload'a ekleyelim
        payload.questions.push(basicQuestion);
      }
    }

    console.log('Final payload:', JSON.stringify(payload, null, 2));

    this.pollService.updatePoll(this.pollId, payload).subscribe({
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
          text: err.error.message || 'Bir hata oluştu',
          icon: 'error',
          confirmButtonText: 'Kapat',
        });
      },
    });
  }
}
