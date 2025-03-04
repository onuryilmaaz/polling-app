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

  // // Anket silme işlemi için MatSnackBar ile onay gösterme
  // deletePoll(id: number): void {
  //   this.snackBar
  //     .open('Bu anketi silmek istediğinizden emin misiniz?', 'Evet', {
  //       duration: 5000,
  //       horizontalPosition: 'center',
  //       verticalPosition: 'bottom',
  //     })
  //     .afterDismissed()
  //     .subscribe((result) => {
  //       if (result.dismissedByAction) {
  //         this.pollService.deletePoll(id).subscribe({
  //           next: () => {
  //             this.loadActivePolls(); // Silme işlemi başarılı olduktan sonra listeyi güncelle
  //             this.snackBar.open('Anket başarıyla silindi.', 'Kapat', {
  //               duration: 3000,
  //               horizontalPosition: 'center',
  //               verticalPosition: 'bottom',
  //             });
  //           },
  //           error: (err) => {
  //             console.error('Anket silinirken hata oluştu:', err);
  //             this.snackBar.open('Anket silinirken hata oluştu.', 'Kapat', {
  //               duration: 3000,
  //               horizontalPosition: 'center',
  //               verticalPosition: 'bottom',
  //             });
  //           },
  //         });
  //       }
  //     });
  // }

  // Anket silme işlemi
  deletePoll(id: number): void {
    if (confirm('Bu anketi silmek istediğinizden emin misiniz?')) {
      this.pollService.deletePoll(id).subscribe({
        next: () => {
          // Silme işlemi başarılıysa aktif anketleri yeniden yükle
          this.loadActivePolls();
        },
        error: (err) => {
          console.error('Anket silinirken hata oluştu:', err);
        },
      });
    }
  }
}
