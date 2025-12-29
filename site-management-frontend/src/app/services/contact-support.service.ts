import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SupportTicket {
  email: string;
  subject: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
}

@Injectable({
  providedIn: 'root'
})
export class ContactSupportService {
  private modalStateSubject = new BehaviorSubject<boolean>(false);
  public modalState$: Observable<boolean> = this.modalStateSubject.asObservable();

  private supportEmail = 'dukisofronievski@gmail.com';
  private ticketHistory: SupportTicket[] = [];

  constructor() {}

  openModal(): void {
    this.modalStateSubject.next(true);
  }

  closeModal(): void {
    this.modalStateSubject.next(false);
  }

  isModalOpen(): boolean {
    return this.modalStateSubject.value;
  }

  sendSupportEmail(userEmail: string, subject: string, message: string): boolean {
    try {
      const ticket: SupportTicket = {
        email: userEmail,
        subject,
        message,
        timestamp: new Date(),
        status: 'pending'
      };

      const mailtoSubject = encodeURIComponent(subject);
      const mailtoBody = encodeURIComponent(
        `From: ${userEmail}\n\nMessage:\n${message}\n\n---\nSent from ALTEA Management System\n${new Date().toLocaleString()}`
      );

      window.open(
        `mailto:${this.supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`,
        '_blank'
      );

      ticket.status = 'sent';
      this.ticketHistory.push(ticket);
      
      return true;
    } catch (error) {
      console.error('Error sending support email:', error);
      return false;
    }
  }

  getSupportEmail(): string {
    return this.supportEmail;
  }

  getTicketHistory(): SupportTicket[] {
    return [...this.ticketHistory];
  }

  clearHistory(): void {
    this.ticketHistory = [];
  }
}
