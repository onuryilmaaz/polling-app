import { Component, OnInit } from '@angular/core';
import { PollService } from '../../services/poll.service';
import {
  PollCreateDto,
  QuestionCreateDto,
  OptionCreateDto,
  QuestionType,
} from '../../models/poll.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-poll-create',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './poll-create.component.html',
  styleUrls: ['./poll-create.component.css'],
})
export class PollCreateComponent implements OnInit {
  poll: PollCreateDto = {
    title: '',
    description: '',
    expiryDate: undefined,
    isActive: true,
    questions: [],
  };

  constructor(private pollService: PollService) {}

  ngOnInit(): void {}

  // Yeni soru ekleme
  addQuestion(): void {
    this.poll.questions.push({
      text: '',
      type: QuestionType.SingleChoice,
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

  // Form gönderildiğinde çağrılır
  // onSubmit(): void {
  //   this.pollService.createPoll(this.poll).subscribe({
  //     next: (response) => {
  //       console.log('Anket başarıyla oluşturuldu:', response);
  //       alert('Anket başarıyla oluşturuldu!');
  //     },
  //     error: (err) => {
  //       console.error('Anket oluşturulurken hata oluştu:', err);
  //       alert('Anket oluşturulurken bir hata oluştu.');
  //     },
  //   });
  // }

  onSubmit(): void {
    // expiryDate'i ISO 8601 formatına dönüştür
    // if (this.poll.expiryDate) {
    //   this.poll.expiryDate = new Date(this.poll.expiryDate).toISOString();
    // }
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
        console.log('Anket başarıyla oluşturuldu:', response);
        alert('Anket başarıyla oluşturuldu!');
      },
      error: (err) => {
        console.error('Anket oluşturulurken hata oluştu:', err);
        if (err.error && err.error.errors) {
          console.log('Validation Errors:', err.error.errors);
        }
        alert('Anket oluşturulurken bir hata oluştu: ' + err.message);
      },
    });
  }
}
