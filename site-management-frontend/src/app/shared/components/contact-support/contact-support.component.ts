import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContactSupportService } from '../../../services/contact-support.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-contact-support',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './contact-support.component.html',
  styleUrls: ['./contact-support.component.css']
})
export class ContactSupportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  supportForm: FormGroup;
  isVisible = false;
  isSubmitting = false;
  showSuccess = false;
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private contactSupportService: ContactSupportService,
    private authService: AuthService
  ) {
    this.supportForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Subscribe to modal state
    this.contactSupportService.modalState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        this.isVisible = isOpen;
        if (isOpen) {
          this.resetForm();
        }
      });

    // Get current user email
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.user) {
          this.userEmail = state.user.email;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeModal(): void {
    this.contactSupportService.closeModal();
    this.showSuccess = false;
  }

  onSubmit(): void {
    if (this.supportForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const { subject, message } = this.supportForm.value;
      
      const success = this.contactSupportService.sendSupportEmail(
        this.userEmail,
        subject,
        message
      );

      if (success) {
        this.showSuccess = true;
        setTimeout(() => {
          this.closeModal();
          this.isSubmitting = false;
        }, 2000);
      } else {
        this.isSubmitting = false;
        alert('Failed to send support request. Please try again.');
      }
    }
  }

  resetForm(): void {
    this.supportForm.reset();
    this.showSuccess = false;
    this.isSubmitting = false;
  }

  get supportEmail(): string {
    return this.contactSupportService.getSupportEmail();
  }
}
