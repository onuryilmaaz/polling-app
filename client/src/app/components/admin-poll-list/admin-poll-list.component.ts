import { Component, OnInit } from '@angular/core';
import { PollService } from '../../services/poll.service';
import { PollListDto } from '../../models/poll.models';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar'; // MatSnackBar import edilmelidir

@Component({
  selector: 'app-admin-poll-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-poll-list.component.html',
  styleUrls: ['./admin-poll-list.component.css'],
})
export class AdminPollListComponent implements OnInit {
  activePolls: PollListDto[] = [];

  constructor(
    private pollService: PollService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadActivePolls();
    this.checkPollExpirations();

    // Her 1 saatte bir kontrol et
    setInterval(() => {
      this.checkPollExpirations();
    }, 60 * 60 * 1000);
  }

  isPollExpired(poll: any): boolean {
    if (!poll.expiryDate) return false;

    const expiryDate =
      poll.expiryDate instanceof Date
        ? poll.expiryDate
        : new Date(poll.expiryDate);

    return expiryDate < new Date();
  }

  getStatusLabel(poll: any): string {
    if (this.isPollExpired(poll)) return 'Süresi Doldu';
    return poll.isActive ? 'Aktif' : 'Pasif';
  }

  getToggleButtonLabel(poll: any): string {
    if (this.isPollExpired(poll)) return 'Süresi Doldu';
    return poll.isActive ? 'Anketi Pasifleştir' : 'Anketi Aktifleştir';
  }

  formatExpiryDate(expiryDate: string | Date | undefined): string {
    if (!expiryDate) return 'Süre belirtilmemiş';

    // Convert to Date if it's a string
    const date = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Geçersiz tarih';

    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Arka planda düzenli olarak süresi dolan anketleri kontrol etmek için
  checkPollExpirations() {
    this.pollService.checkPollExpirations().subscribe({
      next: (result) => {
        if (result?.expiredPollCount > 0) {
          this.snackBar.open(
            `${result.expiredPollCount} adet anketin süresi doldu.`,
            'Kapat',
            {
              duration: 3000,
              panelClass: ['warning-snackbar'],
            }
          );

          // Anketleri yeniden yükle
          this.loadActivePolls();
        }
      },
      error: (err) => {
        // Sessizce hatayı yönet, konsola yazmayın
        // Gerekirse daha sonra hata izleme mekanizması ekleyebilirsiniz
      },
    });
  }

  loadActivePolls(): void {
    this.pollService.getMyPolls().subscribe({
      next: (polls) => {
        this.activePolls = polls;
      },
      error: (err) => {
        console.error('Anketler yüklenirken hata oluştu:', err);
      },
    });
  }

  pasifPoll(id: number): void {
    if (this.snackBar.open('Bu anketi silmek istediğinizden emin misiniz?')) {
      this.pollService.deletePoll(id).subscribe({
        next: () => {
          // Silme işlemi başarılıysa aktif anketleri yeniden yükle
          this.loadActivePolls();

          // Başarılı silme mesajını göster
          this.snackBar.open('Anket başarıyla pasifleştirildi', 'Kapat', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        },
        error: (err) => {
          // Hata durumunda kullanıcıya bildirim göster
          this.snackBar.open(
            'Anket silinirken hata oluştu: ' + err.message,
            'Kapat',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
    }
  }

  togglePollStatus(id: number, currentStatus: boolean): void {
    // Konfirmasyon mesajını dinamik olarak ayarla
    const confirmMessage = currentStatus
      ? 'Bu anketi pasifleştirmek istediğinizden emin misiniz?'
      : 'Bu anketi aktifleştirmek istediğinizden emin misiniz?';

    if (confirm(confirmMessage)) {
      this.pollService.deletePoll(id).subscribe({
        next: () => {
          // Aktif anketleri yeniden yükle
          this.loadActivePolls();

          // Başarılı mesajı göster
          const successMessage = currentStatus
            ? 'Anket başarıyla pasifleştirildi'
            : 'Anket başarıyla aktifleştirildi';

          this.snackBar.open(successMessage, 'Kapat', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        },
        error: (err) => {
          // Hata durumunda kullanıcıya bildirim göster
          this.snackBar.open(
            'İşlem sırasında hata oluştu: ' + err.message,
            'Kapat',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
    }
  }
}
