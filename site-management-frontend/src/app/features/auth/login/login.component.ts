import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { LoginRequest, LoginResponse } from '../../../core/models/auth.model';
import { LanguageToggleComponent } from '../../../shared/components/contact-support/language-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, LanguageToggleComponent, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  errorType: 'login' | 'server' | 'network' | null = null;
  showSuccessModal = false;
  showFailedModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberEmail: [false]
    });
  }

  ngOnInit() {
    // Reset component state
    this.isLoading = false;
    this.errorMessage = '';
    this.errorType = null;
    this.showSuccessModal = false;
    this.showFailedModal = false;
    
    
    // Reset form
    this.loginForm.reset();

    // If user previously chose to remember email, load it from localStorage
    try {
      const remembered = localStorage.getItem('rememberedEmail');
      if (remembered) {
        this.loginForm.patchValue({ email: remembered, rememberEmail: true });
      }
    } catch (err) {
      console.warn('Could not read remembered email from localStorage', err);
    }
    
    // Translation service will handle initialization automatically
    // Just ensure the current language is set
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
    
    // Force change detection
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    // Reset state on component destroy
    this.isLoading = false;
    this.errorMessage = '';
    this.errorType = null;
    this.showSuccessModal = false;
    this.showFailedModal = false;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.errorType = null;
      this.showFailedModal = false;
      
      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };
      
      this.authService.login(loginData).subscribe({
        next: (response: LoginResponse) => {
          console.log('=== LOGIN RESPONSE DEBUG ===');
          console.log('Full login response:', response);
          console.log('Force password change:', response.force_password_change);
          console.log('============================');

          this.isLoading = false;

          // Check if user needs to change password first
          if (response.force_password_change) {
            console.log('User must change password, redirecting to change-password page');
            this.router.navigate(['/change-password']);
            return;
          }

          // Persist or remove remembered email based on user preference
          try {
            const shouldRemember = !!this.loginForm.value?.rememberEmail;
            const currentEmail = this.loginForm.value?.email;
            if (shouldRemember && currentEmail) {
              localStorage.setItem('rememberedEmail', currentEmail);
              console.log('Remembered email saved to localStorage');
            } else {
              localStorage.removeItem('rememberedEmail');
              console.log('Remembered email removed from localStorage');
            }
          } catch (err) {
            console.warn('Could not access localStorage to store remembered email', err);
          }

          // Show success modal on next tick inside Angular zone to avoid first-render race
          setTimeout(() => {
            this.ngZone.run(() => {
              try {
                this.showSuccessModal = true;
                this.cdr.detectChanges();
                console.log('Success modal set and change detection run:', this.showSuccessModal);
              } catch (err) {
                console.error('Error showing success modal:', err);
              }

              // Small DOM presence debug check (helps catch styling/z-index issues)
              setTimeout(() => {
                const modalPresent = !!document.querySelector('[class*="fixed"][class*="inset-0"]');
                console.log('Modal DOM present after render?', modalPresent);
              }, 40);
            });
          }, 40);

          // Auto-redirect after 5 seconds if user doesn't click continue
          setTimeout(() => {
            if (this.showSuccessModal) {
              console.log('Auto-redirecting to dashboard after 5 seconds...');
              this.ngZone.run(() => this.onSuccessModalClose());
            }
          }, 5000);
        },
        error: (error: any) => {
          console.error('Login error:', error);
          this.isLoading = false;
          
          if (error.status === 401 || error.status === 403) {
            this.errorType = 'login';
            this.errorMessage = error.error?.message || 'Invalid email or password. Please check your credentials.';
          } else if (error.status === 500) {
            this.errorType = 'server';
            this.errorMessage = this.translationService.getTranslation('SERVER_ERROR');
          } else if (error.status === 0) {
            this.errorType = 'network';
            this.errorMessage = 'Network connection failed. Please check your internet connection.';
          } else {
            this.errorType = 'server';
            this.errorMessage = error.error?.message || 'An unexpected error occurred. Please try again.';
          }
          
          this.showFailedModal = true;
          this.cdr.detectChanges();
        }
      });;
    }
  }


  

  onSuccessModalClose() {
    console.log('Closing login success modal...');
    console.log('Current user:', this.authService.currentUser);
    console.log('User role:', this.authService.currentUser?.role?.role_name);
    this.showSuccessModal = false;
    console.log('Navigating to dashboard...');
    // Ensure navigation happens inside Angular zone
    this.ngZone.run(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  onFailedModalClose() {
    this.showFailedModal = false;
    this.errorMessage = '';
    this.errorType = null;
    // Clear password field to allow retry with same email
    this.loginForm.get('password')?.setValue('');
    // Focus on password field for convenience
    setTimeout(() => {
      const passwordField = document.querySelector('input[type="password"]') as HTMLInputElement;
      if (passwordField) {
        passwordField.focus();
      }
    }, 100);
  }
}
