import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PollCreateDto,
  PollUpdateDto,
  PollDetailDto,
  PollListDto,
  PollResponseDto,
} from '../models/poll.models'; // Modelleri import et
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  apiUrl: string = environment.apiUrl;
  //private tokenKey = 'token';

  constructor(private http: HttpClient) {}

  // Anket oluşturma
  createPoll(pollDto: PollCreateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}poll/create`, pollDto, {
      headers: this.getHeaders(),
    });
  }

  // Anket güncelleme
  updatePoll(id: number, pollDto: PollUpdateDto): Observable<any> {
    return this.http.put(`${this.apiUrl}poll/update/${id}`, pollDto, {
      headers: this.getHeaders(),
    });
  }

  //Anket Sonuçları
  getPollResults(id: number) {
    return this.http.get<any>(`${this.apiUrl}poll/results/${id}`);
  }

  // Anket toggle
  tooglePoll(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}poll/toogle/${id}`, {
      headers: this.getHeaders(),
    });
  }

  //Anket Silme
  deletePoll(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}poll/delete/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // Get poll by ID
  getPollById(pollId: number): Observable<PollDetailDto> {
    return this.http.get<PollDetailDto>(`${this.apiUrl}poll/${pollId}`, {
      headers: this.getHeaders(),
    });
  }

  submitPollResponse(
    pollId: number,
    responseDto: PollResponseDto
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}poll/submit/${pollId}`, responseDto, {
      headers: this.getHeaders(),
      withCredentials: true, // Bu satırı ekleyin
    });
  }

  // Check if user has already submitted response for this poll
  checkPollSubmissionStatus(pollId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}poll/${pollId}`, {
      headers: this.getHeaders(),
    });
  }

  // JWT token ile header oluşturma
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Token'ı localStorage'dan al
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Aktif anketleri listeleme
  getActivePolls(): Observable<PollListDto[]> {
    return this.http.get<PollListDto[]>(`${this.apiUrl}poll/active`);
  }

  // Admin için oluşturulan anketleri listeleme
  getMyPolls(): Observable<PollListDto[]> {
    return this.http.get<PollListDto[]>(`${this.apiUrl}poll/my-polls`, {
      headers: this.getHeaders(),
    });
  }

  checkPollExpirations(): Observable<{
    message: string;
    expiredPollCount: number;
  }> {
    return this.http.get<{ message: string; expiredPollCount: number }>(
      `${this.apiUrl}poll/check-expiration`
    );
  }
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}poll/categories`);
  }
}
