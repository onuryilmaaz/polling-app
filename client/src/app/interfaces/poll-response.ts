import { AnswerDto } from '../models/poll.models';

export interface PollResponseDto {
  responseDto: {
    answers: AnswerDto[];
  };
}
