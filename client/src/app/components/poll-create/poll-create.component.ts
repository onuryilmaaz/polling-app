import { Component, OnInit } from '@angular/core';
import { PollService } from '../../services/poll.service';
import { Router } from '@angular/router';

import { PollCreateDto, QuestionType } from '../../models/poll.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poll-create',
  standalone: true,
  imports: [FormsModule, CommonModule],
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

  //constructor(private pollService: PollService) {}
  constructor(private pollService: PollService, private router: Router) {}

  ngOnInit(): void {}

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

  onSubmit(): void {
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
        this.router.navigate(['/poll-list']);
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
