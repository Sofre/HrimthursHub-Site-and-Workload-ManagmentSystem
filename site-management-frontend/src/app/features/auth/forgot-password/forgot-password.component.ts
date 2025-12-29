import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { LanguageToggleComponent } from '../../../shared/components/contact-support/language-toggle.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterModule, LanguageToggleComponent],
  template: `
    <div class="container">
      <div class="card">
        <!-- Language Toggle -->
        <div class="language-toggle">
          <app-language-toggle></app-language-toggle>
        </div>

        <!-- Header -->
        <div class="header">
          <h2>{{ 'FORGOT_PASSWORD' | translate }}</h2>
          <p>{{ 'FORGOT_PASSWORD_MESSAGE' | translate }}</p>
        </div>

        <!-- Form -->
        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
          <!-- Email -->
          <div class="form-group">
            <label for="email">{{ 'EMAIL' | translate }} *</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              [class.error]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
              placeholder="{{ 'ENTER_EMAIL' | translate }}"
            >
            <div *ngIf="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched" class="error-message">
              {{ 'EMAIL_INVALID' | translate }}
            </div>
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="message success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <p>{{ successMessage }}</p>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="message error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p>{{ errorMessage }}</p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="!forgotPasswordForm.valid || isLoading"
            class="btn-primary"
          >
            <span *ngIf="!isLoading">{{ 'SEND_RESET_LINK' | translate }}</span>
            <span *ngIf="isLoading" class="loading">
              <div class="spinner"></div>
              {{ 'SENDING' | translate }}...
            </span>
          </button>

          <!-- Back to Login -->
          <div class="back-link">
            <a routerLink="/login">{{ 'BACK_TO_LOGIN' | translate }}</a>
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

    .back-link {
      text-align: center;
      margin-top: 1rem;
    }

    .back-link a {
      font-size: 0.875rem;
      color: #10b981;
      text-decoration: none;
      font-weight: 500;
    }

    .back-link a:hover {
      color: #059669;
    }
  `]
})

export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translationService: TranslationService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.successMessage = 'If the email exists, you will receive password reset instructions.';
          this.forgotPasswordForm.reset();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.errorMessage = 'Failed to process request. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
