export interface PollCreateDto {
  title: string;
  description?: string;
  expiryDate?: Date;
  isActive: boolean;
  questions: QuestionCreateDto[];
}

export interface PollUpdateDto {
  title: string;
  description?: string;
  expiryDate?: Date;
  isActive: boolean;
  questions: QuestionUpdateDto[];
}

export interface PollDetailDto {
  id: number;
  title: string;
  description?: string;
  createdDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  questions: QuestionDetailDto[];
}

export interface PollListDto {
  id: number;
  title: string;
  description?: string;
  createdDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  questionCount: number;
  responseCount?: number;
}

export interface PollResponseDto {
  answers: AnswerDto[];
}

export interface QuestionCreateDto {
  text: string;
  type: QuestionType;
  orderIndex: number;
  isRequired: boolean;
  maxSelections?: number;
  options: OptionCreateDto[];
}

export interface QuestionUpdateDto {
  id?: number;
  text: string;
  type: QuestionType;
  orderIndex: number;
  isRequired: boolean;
  maxSelections?: number;
  options?: OptionUpdateDto[];
}

export interface QuestionDetailDto {
  id: number;
  text: string;
  type: QuestionType;
  orderIndex: number;
  isRequired: boolean;
  maxSelections?: number;
  options?: OptionDetailDto[];
}

export interface OptionCreateDto {
  text: string;
  orderIndex: number;
}

export interface OptionUpdateDto {
  id?: number;
  text: string;
  orderIndex: number;
}

export interface OptionDetailDto {
  id: number;
  text: string;
  orderIndex: number;
}

// export interface AnswerDto {
//   questionId: number;
//   textAnswer?: string;
//   selectedOptionIds?: Map<number, number>; // Seçenek ID'si ve sıralama (rank) bilgisi
// }

export interface AnswerDto {
  questionId: number;
  textAnswer?: string;
  selectedOptionIds?: number[];
}

export enum QuestionType {
  SingleChoice = 0,
  MultipleChoice = 1,
  Text = 2,
  Ranking = 3,
}
