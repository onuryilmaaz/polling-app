import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PollService } from '../../services/poll.service';
import {
  PollDetailDto,
  PollResponseDto,
  AnswerDto,
} from '../../models/poll.models';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

enum QuestionType {
  MultipleChoice = 0, // Çoktan seçmeli (tek seçim)
  Text = 1, // Metin cevap
  YesNo = 2, // Evet/Hayır
  MultiSelect = 3, // Çoklu seçim (multiple options)
  Ranking = 4, // Sıralama
}

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-detail.component.html',
  styleUrls: ['./poll-detail.component.css'],
})
export class PollDetailComponent implements OnInit {
  poll: PollDetailDto | null = null;
  pollId: number | null = null;
  questionType = QuestionType;
  isLoading = true;
  hasAlreadySubmitted = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  isAuthenticated = false;

  selectedOptions: { [questionId: number]: number | number[] | boolean } = {};
  textAnswers: { [questionId: number]: string } = {};
  rankedOptions: {
    [questionId: number]: { [optionId: number]: number | null };
  } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pollService: PollService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = !!localStorage.getItem('token');

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.pollId = +idParam;
      this.loadPollDetails(this.pollId);
    } else {
      this.isLoading = false;
      this.errorMessage = "Anket ID'si bulunamadı.";
    }
  }

  loadPollDetails(pollId: number): void {
    this.isLoading = true;
    this.pollService.getPollById(pollId).subscribe({
      next: (poll) => {
        this.poll = poll;
        this.isLoading = false;

        if (this.poll.questions) {
          this.poll.questions.forEach((question) => {
            if (question.type === QuestionType.MultiSelect) {
              this.selectedOptions[question.id] = [];
            }

            if (question.type === QuestionType.Ranking && question.options) {
              this.rankedOptions[question.id] = {};
              question.options.forEach((option) => {
                this.rankedOptions[question.id][option.id] = null;
              });
            }
          });
        }
        this.checkSubmissionStatus(pollId);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Anket detayları yüklenirken hata oluştu:', err);
        this.errorMessage = 'Anket detayları yüklenirken bir hata oluştu.';
      },
    });
  }

  checkSubmissionStatus(pollId: number): void {
    this.pollService.checkPollSubmissionStatus(pollId).subscribe({
      next: (response) => {
        if (response && response.hasSubmitted) {
          this.hasAlreadySubmitted = true;
        }
      },
      error: (err) => {
        console.log('Submission status check not implemented on backend', err);
      },
    });
  }

  isOptionSelected(questionId: number, optionId: number): boolean {
    const selected = this.selectedOptions[questionId];
    if (Array.isArray(selected)) {
      return selected.includes(optionId);
    }
    return false;
  }

  toggleMultiSelect(questionId: number, optionId: number): void {
    if (!Array.isArray(this.selectedOptions[questionId])) {
      this.selectedOptions[questionId] = [];
    }

    const index = (this.selectedOptions[questionId] as number[]).indexOf(
      optionId
    );

    if (index === -1) {
      (this.selectedOptions[questionId] as number[]).push(optionId);
    } else {
      (this.selectedOptions[questionId] as number[]).splice(index, 1);
    }
  }

  getNumberArray(length: number | undefined): number[] {
    return Array.from({ length: length || 0 }, (_, i) => i + 1);
  }

  validateForm(): boolean {
    if (!this.poll || !this.poll.questions) return false;

    for (const question of this.poll.questions) {
      if (!question.isRequired) continue;

      switch (question.type) {
        case QuestionType.MultipleChoice:
          if (this.selectedOptions[question.id] === undefined) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;

        case QuestionType.MultiSelect:
          const selected = this.selectedOptions[question.id] as number[];
          if (!selected || !Array.isArray(selected) || selected.length === 0) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;

        case QuestionType.Text:
          if (
            !this.textAnswers[question.id] ||
            this.textAnswers[question.id].trim() === ''
          ) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;

        case QuestionType.Ranking:
          const rankingComplete = Object.values(
            this.rankedOptions[question.id] || {}
          ).every((v) => v !== null);
          if (!rankingComplete) {
            alert(
              `Lütfen "${question.text}" sorusundaki tüm seçenekleri sıralayınız.`
            );
            return false;
          }
          break;

        case QuestionType.YesNo:
          if (this.selectedOptions[question.id] === undefined) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;
      }
    }

    return true;
  }

  prepareRankingData(questionId: number): { [key: number]: number } {
    const result: { [key: number]: number } = {};
    const rankings = this.rankedOptions[questionId];

    if (rankings) {
      for (const [optionId, rank] of Object.entries(rankings)) {
        if (rank !== null) {
          result[parseInt(optionId)] = rank;
        }
      }
    }

    return result;
  }

  submitResponse(): void {
    if (!this.pollId || !this.poll) {
      return;
    }

    if (this.hasAlreadySubmitted) {
      alert('Bu anketi daha önce yanıtladınız.');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const answers: AnswerDto[] = [];
    const responseDto: PollResponseDto = {
      answers: [],
    };

    this.poll.questions.forEach((question) => {
      const answer: AnswerDto = {
        questionId: question.id,
        selectedOptionIds: {},
      };

      switch (question.type) {
        case QuestionType.MultipleChoice:
          const selectedOption = this.selectedOptions[question.id];
          if (
            selectedOption !== undefined &&
            typeof selectedOption === 'number'
          ) {
            if (answer.selectedOptionIds != undefined)
              answer.selectedOptionIds[selectedOption] = null;
          }
          break;

        // case QuestionType.YesNo:
        //   const yesNoAnswer = this.selectedOptions[question.id];
        //   if (yesNoAnswer !== undefined) {
        //     const numericValue = yesNoAnswer === true ? question.id : 0;
        //     if (answer.selectedOptionIds != undefined)
        //       answer.selectedOptionIds[numericValue] = null;
        //   }
        //   break;

        case QuestionType.YesNo:
          // Öncelikle question.options'un tanımlı olup olmadığını kontrol ediyoruz.
          if (!question.options) {
            console.error('Soru seçenekleri tanımlı değil.');
            break;
          }

          // Evet ve Hayır seçeneklerini buluyoruz.
          const yesOption = question.options.find((o) => o.text === 'Evet');
          const noOption = question.options.find((o) => o.text === 'Hayır');

          // Seçeneklerin bulunup bulunmadığını kontrol ediyoruz.
          if (!yesOption || !noOption) {
            console.error('Evet veya Hayır seçeneği bulunamadı.');
            break;
          }

          // Seçilen değerin tipini kontrol ediyoruz.
          const selectedValue = this.selectedOptions[question.id];
          if (typeof selectedValue !== 'boolean') {
            console.error('Seçilen değer boolean değil.');
            break;
          }
          const yesNoAnswer: boolean = selectedValue;

          // Seçilen option id'sini belirliyoruz.
          const selectedOptionId = yesNoAnswer ? yesOption.id : noOption.id;
          if (answer.selectedOptionIds !== undefined) {
            answer.selectedOptionIds[selectedOptionId] = null;
          }
          break;

        case QuestionType.MultiSelect:
          const selectedOptions = this.selectedOptions[question.id] as number[];
          if (selectedOptions && selectedOptions.length > 0) {
            selectedOptions.forEach((option) => {
              if (answer.selectedOptionIds != undefined)
                answer.selectedOptionIds[option] = null;
            });
          }
          break;

        case QuestionType.Text:
          const textAnswer = this.textAnswers[question.id];
          if (textAnswer) {
            answer.textAnswer = textAnswer;
          }
          break;

        case QuestionType.Ranking:
          const rankingData = this.prepareRankingData(question.id);
          Object.keys(rankingData).forEach((key) => {
            if (answer.selectedOptionIds != undefined)
              answer.selectedOptionIds[parseInt(key)] =
                rankingData[parseInt(key)];
          });
          break;
      }

      answers.push(answer);
    });

    responseDto.answers = answers;

    this.pollService.submitPollResponse(this.pollId, responseDto).subscribe({
      next: (response) => {
        console.log('Ankete cevap gönderildi:', response);
        this.isSubmitting = false;
        this.hasAlreadySubmitted = true;
        alert('Ankete cevabınız başarıyla gönderildi!');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Ankete cevap gönderilirken hata oluştu:', err);

        if (
          err.status === 400 &&
          err.error &&
          err.error.includes('daha önce yanıtladınız')
        ) {
          this.hasAlreadySubmitted = true;
          this.errorMessage = 'Bu anketi daha önce yanıtladınız.';
        } else if (err.error) {
          this.errorMessage = `Hata: ${err.error}`;
        } else {
          this.errorMessage = 'Ankete cevap gönderilirken bir hata oluştu.';
        }
      },
    });
  }

  login(): void {
    localStorage.setItem('redirectAfterLogin', `/poll/${this.pollId}`);
    this.router.navigate(['/login']);
  }
}
