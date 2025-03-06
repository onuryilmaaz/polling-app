// import { Component, inject } from '@angular/core';
// import { AuthService } from '../../services/auth.service';
// import { AsyncPipe } from '@angular/common';

// @Component({
//   selector: 'app-users',
//   standalone: true,
//   imports: [AsyncPipe],
//   templateUrl: './users.component.html',
//   styleUrl: './users.component.css',
// })
// export class UsersComponent {
//   authService = inject(AuthService);
//   user$ = this.authService.getAll();

// }

import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AsyncPipe, CommonModule } from '@angular/common';

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

  // Kullanıcı durumunu değiştir
  toggleUserStatus(id: string, isActive: boolean) {
    // API'ye tersini gönder
    this.authService.toggleUserStatus(id, !isActive).subscribe(
      () => {
        this.user$ = this.authService.getAll();
      },
      (error) => {
        console.error('Error toggling user status:', error);
      }
    );
  }
}
