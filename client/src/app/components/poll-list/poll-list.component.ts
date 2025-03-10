import { Component, OnInit } from '@angular/core';
import { PollService } from '../../services/poll.service';
import { PollListDto } from '../../models/poll.models';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poll-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poll-list.component.html',
  styleUrls: ['./poll-list.component.css'],
})
export class PollListComponent implements OnInit {
  activePolls: PollListDto[] = [];

  constructor(private pollService: PollService) {}

  ngOnInit(): void {
    this.loadActivePolls();
  }

  loadActivePolls(): void {
    this.pollService.getActivePolls().subscribe({
      next: (polls) => {
        this.activePolls = polls;
      },
      error: (err) => {
        console.error('Anketler yüklenirken hata oluştu:', err);
      },
    });
  }
}
