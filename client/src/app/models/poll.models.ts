export interface PollCreateDto {
  title: string;
  description?: string;
  createdDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  questions: QuestionCreateDto[];
}

export interface PollUpdateDto {
  title: string;
  description?: string;
  createdDate?: Date;
  expiryDate?: Date | null;
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

export interface AnswerDto {
  questionId: number;
  textAnswer?: string;
  selectedOptionIds?: { [key: number]: number | null };
}

export enum QuestionType {
  MultipleChoice = 0, // Çoktan seçmeli (tek seçim)
  Text = 1, // Metin cevap
  YesNo = 2, // Evet/Hayır
  MultiSelect = 3, // Çoklu seçim (multiple options)
  Ranking = 4, // Sıralama
}
