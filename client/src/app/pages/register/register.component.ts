import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ValidationError } from '../../interfaces/validation-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  passwordHide = true;
  confirmPasswordHide = true;
  fb = inject(FormBuilder);
  registerForm!: FormGroup;
  router = inject(Router);
  errors!: ValidationError[];

  register() {
    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        console.log(response);
        this.matSnackBar.open(response.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error response:', err);
        if (err.status === 400) {
          console.log('Validation errors:', err.error.errors); // Hata detaylarını görmek için
          this.errors = err.error.errors;
          this.matSnackBar.open('Validation Error', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
          });
        }
      },
      //complete: () => console.log('Register success'),
    });
  }

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8), // En az 8 karakter
            Validators.pattern(/[A-Z]/), // En az bir büyük harf
            Validators.pattern(/[a-z]/), // En az bir küçük harf
            Validators.pattern(/[0-9]/), // En az bir rakam
            Validators.pattern(/[@$!%*?&.]/), // En az bir özel karakter
          ],
        ],
        fullName: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(15),
          ],
        ],
        roles: [['User']],
        confirmPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8), // En az 8 karakter
            Validators.pattern(/[A-Z]/), // En az bir büyük harf
            Validators.pattern(/[a-z]/), // En az bir küçük harf
            Validators.pattern(/[0-9]/), // En az bir rakam
            Validators.pattern(/[@$!%*?&]/), // En az bir özel karakter
          ],
        ],
      },
      {
        validator: this.passwordMatchValidator,
      }
    );
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
