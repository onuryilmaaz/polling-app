// import { Component, OnInit } from '@angular/core';
// import { PollService } from '../../services/poll.service';
// import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
// import { DatePipe } from '@angular/common';

// @Component({
//   selector: 'app-poll-summary',
//   standalone: true,
//   imports: [CommonModule, RouterLink, DatePipe],
//   templateUrl: './poll-summary.component.html',
//   styleUrls: ['./poll-summary.component.css'],
// })
// export class PollSummaryComponent implements OnInit {
//   pollSummary: any;
//   isLoading = true;
//   errorMessage: string | null = null;

//   constructor(private pollService: PollService) {}

//   ngOnInit(): void {
//     this.pollService.getPollSummary().subscribe({
//       next: (data) => {
//         this.pollSummary = data;
//         this.isLoading = false;
//       },
//       error: (error) => {
//         this.errorMessage = 'Veri alınırken hata oluştu!';
//         this.isLoading = false;
//         console.error(error);
//       },
//     });
//   }
// }

import { Component, OnInit } from '@angular/core';
import { PollService } from '../../services/poll.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import 'chart.js/auto'; // Tüm chart.js özelliklerini import eder

@Component({
  selector: 'app-poll-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, NgChartsModule],
  templateUrl: './poll-summary.component.html',
  styleUrls: ['./poll-summary.component.css'],
})
export class PollSummaryComponent implements OnInit {
  pollSummary: any;
  isLoading = true;
  errorMessage: string | null = null;

  getCategoryName(categoryId: number | null): string {
    if (!categoryId) return 'Kategorisiz';

    // category dizisi varsa, kategorinin adını bul
    if (this.pollSummary.category && this.pollSummary.category.length > 0) {
      const category = this.pollSummary.category.find(
        (c: any) => c.categoryId === categoryId
      );
      return category ? category.categoryName : `Kategori ${categoryId}`;
    }

    return `Kategori ${categoryId}`;
  }

  // Anket Durum Grafiği
  public pollStatusChartData: ChartData<'doughnut'> = {
    labels: ['Aktif', 'Pasif', 'Süresi Dolmuş'],
    datasets: [
      { data: [], backgroundColor: ['#10B981', '#9CA3AF', '#EF4444'] },
    ],
  };

  public pollStatusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  // Kategori Grafiği
  public categoryChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Anket Sayısı',
        backgroundColor: '#3B82F6',
      },
      {
        data: [],
        label: 'Toplam Yanıt',
        backgroundColor: '#8B5CF6',
      },
    ],
  };

  public categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  // Aylık Dağılım Grafiği
  public monthlyChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Oluşturulan Anketler',
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        fill: true,
      },
      {
        data: [],
        label: 'Alınan Yanıtlar',
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  public monthlyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  constructor(private pollService: PollService) {}

  ngOnInit(): void {
    this.pollService.getPollSummary().subscribe({
      next: (data) => {
        this.pollSummary = data;
        this.isLoading = false;

        // Grafik verilerini hazırla
        this.prepareChartData();
      },
      error: (error) => {
        this.errorMessage = 'Veri alınırken hata oluştu!';
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  prepareChartData(): void {
    // Anket durum grafiği için verileri hazırla
    if (this.pollSummary.pollStatusSummary) {
      this.pollStatusChartData.datasets[0].data = [
        this.pollSummary.pollStatusSummary.active,
        this.pollSummary.pollStatusSummary.inactive,
        this.pollSummary.pollStatusSummary.expired,
      ];
    }

    // Kategori grafiği için verileri hazırla
    if (this.pollSummary.category && this.pollSummary.category.length > 0) {
      this.categoryChartData.labels = this.pollSummary.category.map(
        (cat: any) => cat.categoryName || `Kategori ${cat.categoryId}`
      );
      this.categoryChartData.datasets[0].data = this.pollSummary.category.map(
        (cat: any) => cat.pollCount
      );

      // totalResponses alanı category içinde yoksa, veya tüm kategoriler için sıfırsa bu kısmı atlayın
      const hasResponses = this.pollSummary.category.some(
        (cat: any) => cat.totalResponses > 0
      );
      if (hasResponses) {
        this.categoryChartData.datasets[1].data = this.pollSummary.category.map(
          (cat: any) => cat.totalResponses || 0
        );
      } else {
        // totalResponses yoksa ikinci veri setini kaldır
        this.categoryChartData.datasets.pop();
      }
    }

    // Aylık dağılım grafiği için verileri hazırla
    if (
      this.pollSummary.monthlyDistribution &&
      this.pollSummary.monthlyDistribution.length > 0
    ) {
      // Verileri tarihe göre sırala
      const sortedMonthly = [...this.pollSummary.monthlyDistribution].sort(
        (a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        }
      );

      this.monthlyChartData.labels = sortedMonthly.map((m: any) => m.month);
      this.monthlyChartData.datasets[0].data = sortedMonthly.map(
        (m: any) => m.pollsCreated
      );
      this.monthlyChartData.datasets[1].data = sortedMonthly.map(
        (m: any) => m.responsesReceived
      );
    }
  }
}
