import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { LanguageToggleComponent } from '../../../shared/components/contact-support/language-toggle.component';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, LanguageToggleComponent],
  template: `
    <div class="container">
      <div class="card">
        <!-- Language Toggle -->
        <div class="language-toggle">
          <app-language-toggle></app-language-toggle>
        </div>

        <!-- Header -->
        <div class="header">
          <h2>{{ 'CHANGE_PASSWORD_REQUIRED' | translate }}</h2>
          <p>{{ 'CHANGE_PASSWORD_FIRST_LOGIN_MESSAGE' | translate }}</p>
        </div>

        <!-- Form -->
        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
          <!-- Current Password -->
          <div class="form-group">
            <label for="currentPassword">{{ 'CURRENT_PASSWORD' | translate }} *</label>
            <input
              id="currentPassword"
              type="password"
              formControlName="currentPassword"
              [class.error]="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched"
              placeholder="{{ 'ENTER_CURRENT_PASSWORD' | translate }}"
            >
            <div *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched" class="error-message">
              {{ 'CURRENT_PASSWORD_REQUIRED' | translate }}
            </div>
          </div>

          <!-- New Password -->
          <div class="form-group">
            <label for="newPassword">{{ 'NEW_PASSWORD' | translate }} *</label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              [class.error]="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched"
              placeholder="{{ 'ENTER_NEW_PASSWORD' | translate }}"
            >
            <div *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched" class="error-message">
              {{ 'PASSWORD_MIN_LENGTH' | translate }}
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword">{{ 'CONFIRM_PASSWORD' | translate }} *</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              [class.error]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched"
              placeholder="{{ 'CONFIRM_NEW_PASSWORD' | translate }}"
            >
            <div *ngIf="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched" class="error-message">
              {{ 'CONFIRM_PASSWORD_REQUIRED' | translate }}
            </div>
            <div *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched" class="error-message">
              {{ 'PASSWORDS_DO_NOT_MATCH' | translate }}
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="message error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p>{{ errorMessage }}</p>
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="message success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <p>{{ successMessage }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="!passwordForm.valid || isLoading"
            class="btn-primary"
          >
            <span *ngIf="!isLoading">{{ 'CHANGE_PASSWORD' | translate }}</span>
            <span *ngIf="isLoading" class="loading">
              <div class="spinner"></div>
              {{ 'CHANGING_PASSWORD' | translate }}
            </span>
          </button>

          <!-- Password Requirements -->
          <div class="requirements">
            <p>{{ 'PASSWORD_REQUIREMENTS' | translate }}:</p>
            <ul>
              <li>{{ 'PASSWORD_MIN_8_CHARS' | translate }}</li>
              <li>{{ 'PASSWORD_UPPER_LOWER' | translate }}</li>
              <li>{{ 'PASSWORD_NUMBER' | translate }}</li>
              <li>{{ 'PASSWORD_SPECIAL_CHAR' | translate }}</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to bottom right, #d1fae5, #99f6e4);
      padding: 3rem 1rem;
    }

    .card {
      max-width: 28rem;
      width: 100%;
      background: white;
      padding: 2rem;
      border-radius: 0.75rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .language-toggle {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h2 {
      font-size: 1.875rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .header p {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #111827;
      outline: none;
      box-sizing: border-box;
    }

    input::placeholder {
      color: #9ca3af;
    }

    input:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    input.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.375rem;
    }

    .message.success {
      background-color: #f0fdf4;
      color: #166534;
    }

    .message.error {
      background-color: #fef2f2;
      color: #991b1b;
    }

    .message svg {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .message.success svg {
      color: #4ade80;
    }

    .message.error svg {
      color: #f87171;
    }

    .message p {
      font-size: 0.875rem;
      font-weight: 500;
      margin: 0;
    }

    .btn-primary {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
      background-color: #10b981;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #059669;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .requirements {
      font-size: 0.75rem;
      color: #4b5563;
    }

    .requirements p {
      font-weight: 500;
      margin: 0 0 0.5rem 0;
    }

    .requirements ul {
      list-style-position: inside;
      margin: 0;
      padding: 0;
    }

    .requirements li {
      margin: 0.25rem 0;
    }
  `]
})
export class ChangePasswordComponent implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translationService: TranslationService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
    
    // If user doesn't need to change password, redirect to dashboard
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { currentPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.successMessage = 'Password changed successfully! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to change password. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
