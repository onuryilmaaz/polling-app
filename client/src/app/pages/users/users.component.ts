import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [AsyncPipe, CommonModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent {
  authService = inject(AuthService);
  user$ = this.authService.getAll();

  toggleUserStatus(id: string, isActive: boolean) {
    Swal.fire({
      title: 'Emin misiniz?',
      text: isActive
        ? 'Kullanıcıyı devre dışı bırakmak istiyor musunuz?'
        : 'Kullanıcıyı aktifleştirmek istiyor musunuz?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet',
      cancelButtonText: 'Vazgeç',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.toggleUserStatus(id, !isActive).subscribe(
          () => {
            Swal.fire({
              title: 'Başarılı!',
              text: 'Kullanıcı durumu güncellendi.',
              icon: 'success',
            });
            this.user$ = this.authService.getAll();
          },
          (error) => {
            Swal.fire({
              title: 'Hata!',
              text: 'Bir hata oluştu, lütfen tekrar deneyin.',
              icon: 'error',
            });
            console.error('Error toggling user status:', error);
          }
        );
      }
    });
  }
}
