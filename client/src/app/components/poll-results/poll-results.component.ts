// // poll-results.component.ts
// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, RouterLink } from '@angular/router';
// import { PollService } from '../../services/poll.service';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-poll-results',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './poll-results.component.html',
//   styleUrls: ['./poll-results.component.css'],
// })
// export class PollResultsComponent implements OnInit {
//   poll: any;
//   loading = true;
//   error: string | null = null;

//   constructor(
//     private route: ActivatedRoute,
//     private pollService: PollService
//   ) {}

//   ngOnInit(): void {
//     const id = this.route.snapshot.paramMap.get('id');
//     if (id) {
//       this.pollService.getPollResults(+id).subscribe({
//         next: (data) => {
//           this.poll = data;
//           this.loading = false;
//         },
//         error: (err) => {
//           this.error = err.error || 'An error occurred';
//           this.loading = false;
//         },
//       });
//     }
//   }
//   isTextQuestion(question: any): boolean {
//     return question.type === 'Text';
//   }

//   formatExpiryDate(dateString: string): string {
//     return new Date(dateString).toLocaleDateString('tr-TR', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric',
//     });
//   }

//   getRankCount(distribution: any[], rank: number): number {
//     const found = distribution.find((d: any) => d.rank === rank);
//     return found ? found.count : 0;
//   }

//   getRankColumns(question: any): number[] {
//     const maxRank = Math.max(
//       ...question.rankingResults.flatMap((o: any) =>
//         o.rankDistribution.map((r: any) => r.rank)
//       )
//     );
//     return Array.from({ length: maxRank }, (_, i) => i + 1);
//   }

//   isMultiSelect(question: any): boolean {
//     return question.Type === 'MultiSelect';
//   }

//   isRanking(question: any): boolean {
//     return question.Type === 'Ranking';
//   }
// }

// poll-results.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PollService } from '../../services/poll.service';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Chart.js'i kaydet
Chart.register(...registerables);

@Component({
  selector: 'app-poll-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-results.component.html',
  styleUrls: ['./poll-results.component.css'],
})
export class PollResultsComponent implements OnInit, AfterViewInit {
  poll: any;
  loading = true;
  error: string | null = null;
  charts: { [key: string]: Chart } = {};

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

          // Verileri yükledikten sonra, AfterViewInit'te grafikleri oluşturmak için
          // bir miktar gecikme verelim (DOM'un güncellenmesini beklemek için)
          setTimeout(() => {
            this.createCharts();
          }, 1000);
        },
        error: (err) => {
          this.error = err.error || 'An error occurred';
          this.loading = false;
        },
      });
    }
  }

  ngAfterViewInit(): void {
    // Grafikler ngAfterViewInit'te oluşturulabilir, ancak bu durumda
    // veri yüklendikten sonra oluşturulmalıdır
  }

  createCharts(): void {
    if (!this.poll || !this.poll.questions) return;

    this.poll.questions.forEach((question: any, index: number) => {
      const questionId = `question-${index}`;

      if (question.type === 'MultipleChoice' || question.type === 'YesNo') {
        this.createPieChart(questionId, question);
        this.createBarChart(`${questionId}-bar`, question);
      } else if (question.type === 'MultiSelect') {
        this.createHorizontalBarChart(questionId, question);
      } else if (question.type === 'Ranking') {
        this.createStackedBarChart(questionId, question);
      }
    });
  }

  createPieChart(containerId: string, question: any): void {
    const canvasElement = document.getElementById(`${containerId}-pie`);
    if (!canvasElement) return;

    const labels = question.options.map((option: any) => option.text);
    const data = question.options.map((option: any) => option.count);
    const backgroundColor = this.generateColors(labels.length);

    const chart = new Chart(canvasElement as HTMLCanvasElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColor,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: question.text,
          },
        },
      },
    });

    this.charts[`${containerId}-pie`] = chart;
  }

  createBarChart(containerId: string, question: any): void {
    const canvasElement = document.getElementById(containerId);
    if (!canvasElement) return;

    const labels = question.options.map((option: any) => option.text);
    const data = question.options.map((option: any) => option.count);
    const backgroundColor = this.generateColors(labels.length);

    const chart = new Chart(canvasElement as HTMLCanvasElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cevap Sayısı',
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.map((color) =>
              color.replace('0.7', '1')
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: question.text,
          },
        },
      },
    });

    this.charts[containerId] = chart;
  }

  createHorizontalBarChart(containerId: string, question: any): void {
    const canvasElement = document.getElementById(`${containerId}-horizontal`);
    if (!canvasElement) return;

    const selectionCounts = question.multiSelectResults.selectionCounts;
    const labels = selectionCounts.map((option: any) => option.text);
    const data = selectionCounts.map((option: any) => option.count);
    const backgroundColor = this.generateColors(labels.length);

    const chart = new Chart(canvasElement as HTMLCanvasElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Seçilme Sayısı',
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.map((color) =>
              color.replace('0.7', '1')
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: question.text,
          },
        },
      },
    });

    this.charts[`${containerId}-horizontal`] = chart;
  }

  createStackedBarChart(containerId: string, question: any): void {
    const canvasElement = document.getElementById(`${containerId}-stacked`);
    if (!canvasElement) return;

    const options = question.rankingResults.map((option: any) => option.text);
    const ranks = Array.from(
      { length: question.maxSelections },
      (_, i) => i + 1
    );

    // Her sıralama için datasets oluşturma
    const datasets = ranks.map((rank, index) => {
      return {
        label: `Sıralama ${rank}`,
        data: question.rankingResults.map((option: any) => {
          const distribution = option.rankDistribution.find(
            (d: any) => d.rank === rank
          );
          return distribution ? distribution.count : 0;
        }),
        backgroundColor: this.generateColors(ranks.length)[index],
        stack: 'Stack 0',
      };
    });

    const chart = new Chart(canvasElement as HTMLCanvasElement, {
      type: 'bar',
      data: {
        labels: options,
        datasets: datasets,
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: question.text,
          },
        },
      },
    });

    this.charts[`${containerId}-stacked`] = chart;
  }

  generateColors(count: number): string[] {
    const baseColors = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(40, 167, 69, 0.7)',
      'rgba(220, 53, 69, 0.7)',
    ];

    // Gerekirse renkleri tekrar ederek istenen sayıda renk oluşturma
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
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
