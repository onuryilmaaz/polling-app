// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { PollService } from '../../services/poll.service';
// import { PollDetailDto } from '../../models/poll.models';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-poll-detail',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './poll-detail.component.html',
//   styleUrls: ['./poll-detail.component.css'],
// })
// export class PollDetailComponent implements OnInit {
//   poll: PollDetailDto | null = null;
//   pollId: number | null = null;

//   constructor(
//     private route: ActivatedRoute,
//     private pollService: PollService
//   ) {}

//   ngOnInit(): void {
//     // URL'den poll ID'sini al
//     this.pollId = +this.route.snapshot.paramMap.get('id')!;

//     // Anket detaylarını yükle
//     if (this.pollId) {
//       this.loadPollDetails(this.pollId);
//     }
//   }

//   loadPollDetails(pollId: number): void {
//     this.pollService.getPollById(pollId).subscribe({
//       next: (poll) => {
//         this.poll = poll;
//       },
//       error: (err) => {
//         console.error('Anket detayları yüklenirken hata oluştu:', err);
//         alert('Anket detayları yüklenirken bir hata oluştu.');
//       },
//     });
//   }

//   submitResponse(): void {
//     if (this.pollId) {
//       // Burada kullanıcının cevaplarını API'ye gönderebilirsiniz
//       console.log('Ankete cevap gönderildi:', this.poll);
//       alert('Ankete cevabınız başarıyla gönderildi!');
//     }
//   }
// }

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PollService } from '../../services/poll.service';
import {
  PollDetailDto,
  PollResponseDto,
  AnswerDto,
} from '../../models/poll.models';
import { FormsModule } from '@angular/forms'; // Bu satırı ekleyin
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule], // FormsModule'ü ekleyin
  templateUrl: './poll-detail.component.html',
  styleUrls: ['./poll-detail.component.css'],
})
export class PollDetailComponent implements OnInit {
  poll: PollDetailDto | null = null;
  pollId: number | null = null;

  // Kullanıcının cevaplarını saklamak için
  selectedOptions: { [questionId: number]: number | number[] } = {};
  textAnswers: { [questionId: number]: string } = {};
  rankedOptions: { [questionId: number]: { [optionId: number]: number } } = {};

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService
  ) {}

  ngOnInit(): void {
    // URL'den poll ID'sini al
    this.pollId = +this.route.snapshot.paramMap.get('id')!;

    // Anket detaylarını yükle
    if (this.pollId) {
      this.loadPollDetails(this.pollId);
    }
  }

  loadPollDetails(pollId: number): void {
    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        this.poll = poll;
        // Ranked options için başlangıç değerlerini ayarla
        this.poll.questions.forEach((question) => {
          if (question.type === 3) {
            this.rankedOptions[question.id] = {};
          }
        });
      },
      error: (err) => {
        console.error('Anket detayları yüklenirken hata oluştu:', err);
        alert('Anket detayları yüklenirken bir hata oluştu.');
      },
    });
  }

  // submitResponse(): void {
  //   if (!this.pollId || !this.poll) {
  //     return;
  //   }

  //   // Cevapları topla
  //   const answers: AnswerDto[] = [];

  //   this.poll.questions.forEach((question) => {
  //     // Sadece gerçekten veri varsa cevap ekle
  //     const selected = this.selectedOptions[question.id];
  //     const textAnswer = this.textAnswers[question.id];
  //     const rankedOptions = this.rankedOptions[question.id];

  //     // Cevap verilmemiş soruları atla
  //     if (!selected && !textAnswer && !rankedOptions) {
  //       return;
  //     }

  //     const answer: AnswerDto = { questionId: question.id };

  //     if (question.type === 0 || question.type === 1) {
  //       // Tekli veya Çoklu Seçim
  //       if (selected) {
  //         answer.selectedOptionIds = Array.isArray(selected) ? selected : [selected];
  //       } else {
  //         // Hiçbir şey seçilmediyse boş dizi gönderme
  //         answer.selectedOptionIds = [];
  //       }
  //     } else if (question.type === 2) {
  //       // Metin Cevabı - sadece gerçek bir cevap varsa ayarla
  //       if (textAnswer && textAnswer.trim()) {
  //         answer.textAnswer = textAnswer;
  //       } else {
  //         answer.textAnswer = '';
  //       }
  //     } else if (question.type === 3) {
  //       // Sıralama
  //       if (rankedOptions && Object.keys(rankedOptions).length > 0) {
  //         answer.selectedOptionIds = Object.keys(rankedOptions).map(Number);
  //       } else {
  //         answer.selectedOptionIds = [];
  //       }
  //     }

  //     answers.push(answer);
  //   });

  //   // Hiç cevap yoksa gönderme
  //   if (answers.length === 0) {
  //     alert('Lütfen en az bir soruyu cevaplayın.');
  //     return;
  //   }

  //   // API'ye gönder
  //   const responseDto: PollResponseDto = { answers };
  //   console.log('Gönderilen cevaplar:', responseDto);

  //   this.pollService.submitPollResponse(this.pollId, responseDto).subscribe({
  //     next: (response) => {
  //       console.log('Ankete cevap gönderildi:', response);
  //       alert('Ankete cevabınız başarıyla gönderildi!');
  //     },
  //     error: (err) => {
  //       console.error('Ankete cevap gönderilirken hata oluştu:', err);
  //       // Daha detaylı hata bilgisi göster
  //       if (err.error && err.error.message) {
  //         alert(`Hata: ${err.error.message}`);
  //       } else {
  //         alert('Ankete cevap gönderilirken bir hata oluştu.');
  //       }
  //     },
  //   });
  // }

  submitResponse(): void {
    if (!this.pollId || !this.poll) {
      return;
    }

    // Cevapları topla
    const answers: AnswerDto[] = [];

    this.poll.questions.forEach((question) => {
      const answer: AnswerDto = { questionId: question.id };

      if (question.type === 0 || question.type === 1) {
        // Tekli veya Çoklu Seçim
        const selectedOptions = this.selectedOptions[question.id];
        if (selectedOptions) {
          answer.selectedOptionIds = Array.isArray(selectedOptions)
            ? selectedOptions
            : [selectedOptions];
        } else {
          console.error(`Soru ${question.id} için seçenek seçilmedi.`);
          return;
        }
      } else if (question.type === 2) {
        // Metin Cevabı
        const textAnswer = this.textAnswers[question.id];
        if (textAnswer) {
          answer.textAnswer = textAnswer;
        } else {
          console.error(`Soru ${question.id} için metin cevabı girilmedi.`);
          return;
        }
      } else if (question.type === 3) {
        // Sıralama
        const rankedOptions = this.rankedOptions[question.id];
        if (rankedOptions && Object.keys(rankedOptions).length > 0) {
          answer.selectedOptionIds = Object.keys(rankedOptions).map(Number);
        } else {
          console.error(`Soru ${question.id} için sıralama yapılmadı.`);
          return;
        }
      }

      answers.push(answer);
    });

    // API'ye gönder
    const responseDto: PollResponseDto = { answers };
    this.pollService.submitPollResponse(this.pollId, responseDto).subscribe({
      next: (response) => {
        console.log('Ankete cevap gönderildi:', response);
        alert('Ankete cevabınız başarıyla gönderildi!');
      },
      error: (err) => {
        console.error('Ankete cevap gönderilirken hata oluştu:', err);
        if (err.error && err.error.errors) {
          console.log('Validation Errors:', err.error.errors);
        }
        alert('Ankete cevap gönderilirken bir hata oluştu.');
      },
    });
  }
}
