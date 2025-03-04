// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { PollService } from '../../services/poll.service';
// import {
//   PollDetailDto,
//   PollResponseDto,
//   AnswerDto,
// } from '../../models/poll.models';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// // Updated enum to match backend
// enum QuestionType {
//   MultipleChoice = 0, // Çoktan seçmeli (tek seçim)
//   Text = 1, // Metin cevap
//   YesNo = 2, // Evet/Hayır
//   MultiSelect = 3, // Çoklu seçim (multiple options)
//   Ranking = 4, // Sıralama
// }

// @Component({
//   selector: 'app-poll-detail',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './poll-detail.component.html',
//   styleUrls: ['./poll-detail.component.css'],
// })
// export class PollDetailComponent implements OnInit {
//   poll: PollDetailDto | null = null;
//   pollId: number | null = null;
//   questionType = QuestionType; // Expose enum to template

//   // User's answers
//   selectedOptions: { [questionId: number]: number | number[] | boolean } = {};
//   textAnswers: { [questionId: number]: string } = {};
//   rankedOptions: {
//     [questionId: number]: { [optionId: number]: number | null };
//   } = {};

//   constructor(
//     private route: ActivatedRoute,
//     private pollService: PollService
//   ) {}

//   ngOnInit(): void {
//     // Get poll ID from URL
//     const idParam = this.route.snapshot.paramMap.get('id');

//     if (idParam) {
//       this.pollId = +idParam;
//       this.loadPollDetails(this.pollId);
//     }
//   }

//   loadPollDetails(pollId: number): void {
//     this.pollService.getPollById(pollId).subscribe({
//       next: (poll) => {
//         this.poll = poll;

//         // Initialize data structures for each question type
//         if (this.poll.questions) {
//           this.poll.questions.forEach((question) => {
//             // For multi select questions, initialize as array
//             if (question.type === QuestionType.MultiSelect) {
//               this.selectedOptions[question.id] = [];
//             }

//             // For ranking questions, initialize object for each option
//             if (question.type === QuestionType.Ranking && question.options) {
//               this.rankedOptions[question.id] = {};
//               question.options.forEach((option) => {
//                 this.rankedOptions[question.id][option.id] = null;
//               });
//             }
//           });
//         }
//       },
//       error: (err) => {
//         console.error('Anket detayları yüklenirken hata oluştu:', err);
//         alert('Anket detayları yüklenirken bir hata oluştu.');
//       },
//     });
//   }

//   // Helper method to check if an option is selected in a multi select question
//   isOptionSelected(questionId: number, optionId: number): boolean {
//     const selected = this.selectedOptions[questionId];
//     if (Array.isArray(selected)) {
//       return selected.includes(optionId);
//     }
//     return false;
//   }

//   // Toggle multi select selection
//   toggleMultiSelect(questionId: number, optionId: number): void {
//     if (!Array.isArray(this.selectedOptions[questionId])) {
//       this.selectedOptions[questionId] = [];
//     }

//     const index = (this.selectedOptions[questionId] as number[]).indexOf(
//       optionId
//     );

//     if (index === -1) {
//       // Add option if not already selected
//       (this.selectedOptions[questionId] as number[]).push(optionId);
//     } else {
//       // Remove option if already selected
//       (this.selectedOptions[questionId] as number[]).splice(index, 1);
//     }
//   }

//   // Helper method to create array for ranking dropdown
//   getNumberArray(length: number | undefined): number[] {
//     return Array.from({ length: length || 0 }, (_, i) => i + 1);
//   }

//   // Validate if required questions are answered
//   validateForm(): boolean {
//     if (!this.poll || !this.poll.questions) return false;

//     for (const question of this.poll.questions) {
//       if (!question.isRequired) continue;

//       switch (question.type) {
//         case QuestionType.MultipleChoice: // Single choice
//           if (this.selectedOptions[question.id] === undefined) {
//             alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
//             return false;
//           }
//           break;

//         case QuestionType.MultiSelect: // Multi select
//           const selected = this.selectedOptions[question.id] as number[];
//           if (!selected || !Array.isArray(selected) || selected.length === 0) {
//             alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
//             return false;
//           }
//           break;

//         case QuestionType.Text: // Text
//           if (
//             !this.textAnswers[question.id] ||
//             this.textAnswers[question.id].trim() === ''
//           ) {
//             alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
//             return false;
//           }
//           break;

//         case QuestionType.Ranking: // Ranking
//           const rankingComplete = Object.values(
//             this.rankedOptions[question.id] || {}
//           ).every((v) => v !== null);
//           if (!rankingComplete) {
//             alert(
//               `Lütfen "${question.text}" sorusundaki tüm seçenekleri sıralayınız.`
//             );
//             return false;
//           }
//           break;

//         case QuestionType.YesNo: // Yes/No
//           if (this.selectedOptions[question.id] === undefined) {
//             alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
//             return false;
//           }
//           break;
//       }
//     }

//     return true;
//   }

//   // Convert ranking data to the required structure for submission
//   prepareRankingData(questionId: number): { [key: number]: number } {
//     const result: { [key: number]: number } = {};
//     const rankings = this.rankedOptions[questionId];

//     if (rankings) {
//       for (const [optionId, rank] of Object.entries(rankings)) {
//         if (rank !== null) {
//           result[parseInt(optionId)] = rank;
//         }
//       }
//     }

//     return result;
//   }

//   submitResponse(): void {
//     if (!this.pollId || !this.poll) {
//       return;
//     }

//     // Validate form first
//     if (!this.validateForm()) {
//       return;
//     }

//     const answers: AnswerDto[] = [];
//     const responseDto: PollResponseDto = {
//       answers: [],
//     };

//     this.poll.questions.forEach((question) => {
//       const answer: AnswerDto = {
//         questionId: question.id,
//         selectedOptionIds: {}, // Ensure selectedOptionIds is initialized as an empty object
//       };

//       switch (question.type) {
//         case QuestionType.MultipleChoice:
//           const selectedOption = this.selectedOptions[question.id];
//           if (
//             selectedOption !== undefined &&
//             typeof selectedOption === 'number'
//           ) {
//             if (answer.selectedOptionIds != undefined)
//               answer.selectedOptionIds[selectedOption] = null; // Safe to index here
//           }
//           break;

//         case QuestionType.MultiSelect:
//           const selectedOptions = this.selectedOptions[question.id] as number[];
//           if (selectedOptions && selectedOptions.length > 0) {
//             selectedOptions.forEach((option) => {
//               if (answer.selectedOptionIds != undefined)
//                 answer.selectedOptionIds[option] = null; // Safe to index here
//             });
//           }
//           break;

//         case QuestionType.Text:
//           const textAnswer = this.textAnswers[question.id];
//           if (textAnswer) {
//             answer.textAnswer = textAnswer;
//             // No need to reinitialize selectedOptionIds here
//           }
//           break;

//         case QuestionType.Ranking:
//           const rankingData = this.prepareRankingData(question.id);
//           Object.keys(rankingData).forEach((key) => {
//             if (answer.selectedOptionIds != undefined)
//               answer.selectedOptionIds[parseInt(key)] = null; // Safe to index here
//           });
//           break;

//         case QuestionType.YesNo:
//           const yesNoAnswer = this.selectedOptions[question.id];
//           if (yesNoAnswer !== undefined) {
//             const numericValue = yesNoAnswer === true ? 1 : 0;
//             if (answer.selectedOptionIds != undefined)
//               answer.selectedOptionIds[numericValue] = null; // Safe to index here
//           }
//           break;
//       }

//       answers.push(answer);
//     });

//     responseDto.answers = answers;

//     // Send to API
//     this.pollService.submitPollResponse(this.pollId, responseDto).subscribe({
//       next: (response) => {
//         console.log('Ankete cevap gönderildi:', response);
//         alert('Ankete cevabınız başarıyla gönderildi!');
//       },
//       error: (err) => {
//         console.error('Ankete cevap gönderilirken hata oluştu:', err);
//         if (err.error) {
//           console.log('Validation Errors:', err.error);
//         }
//         alert('Ankete cevap gönderilirken bir hata oluştu.');
//       },
//     });
//   }
// }

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

// Updated enum to match backend
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
  questionType = QuestionType; // Expose enum to template
  isLoading = true;
  hasAlreadySubmitted = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  isAuthenticated = false;

  // User's answers
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
    // Check if user is authenticated
    this.isAuthenticated = !!localStorage.getItem('token');

    // Get poll ID from URL
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

        // Initialize data structures for each question type
        if (this.poll.questions) {
          this.poll.questions.forEach((question) => {
            // For multi select questions, initialize as array
            if (question.type === QuestionType.MultiSelect) {
              this.selectedOptions[question.id] = [];
            }

            // For ranking questions, initialize object for each option
            if (question.type === QuestionType.Ranking && question.options) {
              this.rankedOptions[question.id] = {};
              question.options.forEach((option) => {
                this.rankedOptions[question.id][option.id] = null;
              });
            }
          });
        }

        // Check if user has already submitted this poll
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
    // Note: Ideally, your backend would provide an endpoint to check this
    // For now, we'll try the form submission and handle the error
    // You can implement a proper status check endpoint on your backend
    this.pollService.checkPollSubmissionStatus(pollId).subscribe({
      next: (response) => {
        if (response && response.hasSubmitted) {
          this.hasAlreadySubmitted = true;
        }
      },
      error: (err) => {
        // If your backend doesn't have this endpoint yet, it's ok to fail silently
        console.log('Submission status check not implemented on backend', err);
      },
    });
  }

  // Helper method to check if an option is selected in a multi select question
  isOptionSelected(questionId: number, optionId: number): boolean {
    const selected = this.selectedOptions[questionId];
    if (Array.isArray(selected)) {
      return selected.includes(optionId);
    }
    return false;
  }

  // Toggle multi select selection
  toggleMultiSelect(questionId: number, optionId: number): void {
    if (!Array.isArray(this.selectedOptions[questionId])) {
      this.selectedOptions[questionId] = [];
    }

    const index = (this.selectedOptions[questionId] as number[]).indexOf(
      optionId
    );

    if (index === -1) {
      // Add option if not already selected
      (this.selectedOptions[questionId] as number[]).push(optionId);
    } else {
      // Remove option if already selected
      (this.selectedOptions[questionId] as number[]).splice(index, 1);
    }
  }

  // Helper method to create array for ranking dropdown
  getNumberArray(length: number | undefined): number[] {
    return Array.from({ length: length || 0 }, (_, i) => i + 1);
  }

  // Validate if required questions are answered
  validateForm(): boolean {
    if (!this.poll || !this.poll.questions) return false;

    for (const question of this.poll.questions) {
      if (!question.isRequired) continue;

      switch (question.type) {
        case QuestionType.MultipleChoice: // Single choice
          if (this.selectedOptions[question.id] === undefined) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;

        case QuestionType.MultiSelect: // Multi select
          const selected = this.selectedOptions[question.id] as number[];
          if (!selected || !Array.isArray(selected) || selected.length === 0) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;

        case QuestionType.Text: // Text
          if (
            !this.textAnswers[question.id] ||
            this.textAnswers[question.id].trim() === ''
          ) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;

        case QuestionType.Ranking: // Ranking
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

        case QuestionType.YesNo: // Yes/No
          if (this.selectedOptions[question.id] === undefined) {
            alert(`Lütfen "${question.text}" sorusunu cevaplayınız.`);
            return false;
          }
          break;
      }
    }

    return true;
  }

  // Convert ranking data to the required structure for submission
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

    // Check if already submitted
    if (this.hasAlreadySubmitted) {
      alert('Bu anketi daha önce yanıtladınız.');
      return;
    }

    // Validate form first
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
        selectedOptionIds: {}, // Ensure selectedOptionIds is initialized as an empty object
      };

      switch (question.type) {
        case QuestionType.MultipleChoice:
          const selectedOption = this.selectedOptions[question.id];
          if (
            selectedOption !== undefined &&
            typeof selectedOption === 'number'
          ) {
            if (answer.selectedOptionIds != undefined)
              answer.selectedOptionIds[selectedOption] = null; // Safe to index here
          }
          break;

        case QuestionType.MultiSelect:
          const selectedOptions = this.selectedOptions[question.id] as number[];
          if (selectedOptions && selectedOptions.length > 0) {
            selectedOptions.forEach((option) => {
              if (answer.selectedOptionIds != undefined)
                answer.selectedOptionIds[option] = null; // Safe to index here
            });
          }
          break;

        case QuestionType.Text:
          const textAnswer = this.textAnswers[question.id];
          if (textAnswer) {
            answer.textAnswer = textAnswer;
            // No need to reinitialize selectedOptionIds here
          }
          break;

        case QuestionType.Ranking:
          const rankingData = this.prepareRankingData(question.id);
          Object.keys(rankingData).forEach((key) => {
            if (answer.selectedOptionIds != undefined)
              answer.selectedOptionIds[parseInt(key)] =
                rankingData[parseInt(key)]; // Include rank order
          });
          break;

        case QuestionType.YesNo:
          const yesNoAnswer = this.selectedOptions[question.id];
          if (yesNoAnswer !== undefined) {
            const numericValue = yesNoAnswer === true ? 1 : 0;
            if (answer.selectedOptionIds != undefined)
              answer.selectedOptionIds[numericValue] = null; // Safe to index here
          }
          break;
      }

      answers.push(answer);
    });

    responseDto.answers = answers;

    // Send to API
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

  // Attempt to login (redirect to login page)
  login(): void {
    // Store current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', `/poll/${this.pollId}`);
    this.router.navigate(['/login']);
  }
}
