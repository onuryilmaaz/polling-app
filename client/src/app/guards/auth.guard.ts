import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const matSnackBar = inject(MatSnackBar);

  if (inject(AuthService).isLoggedIn()) {
    return true;
  }

  matSnackBar.open('You must be logged in to access this page', 'Ok', {
    duration: 3000,
    horizontalPosition: 'center',
  });
  inject(Router).navigate(['/']);
  return false;
};
