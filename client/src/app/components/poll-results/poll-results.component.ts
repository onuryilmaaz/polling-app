// poll-results.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PollService } from '../../services/poll.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-results.component.html',
  styleUrls: ['./poll-results.component.css'],
})
export class PollResultsComponent implements OnInit {
  poll: any;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private pollService: PollService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pollService.getPollResults(+id).subscribe({
        next: (data) => {
          this.poll = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error || 'An error occurred';
          this.loading = false;
        },
      });
    }
  }
  isTextQuestion(question: any): boolean {
    return question.type === 'Text';
  }

  formatExpiryDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getRankCount(distribution: any[], rank: number): number {
    const found = distribution.find((d: any) => d.rank === rank);
    return found ? found.count : 0;
  }

  getRankColumns(question: any): number[] {
    const maxRank = Math.max(
      ...question.rankingResults.flatMap((o: any) =>
        o.rankDistribution.map((r: any) => r.rank)
      )
    );
    return Array.from({ length: maxRank }, (_, i) => i + 1);
  }

  isMultiSelect(question: any): boolean {
    return question.Type === 'MultiSelect';
  }

  isRanking(question: any): boolean {
    return question.Type === 'Ranking';
  }
}
