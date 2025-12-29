import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Payment {
  payment_id: number;
  amount: number;
  status: string;
  site_id?: number;
  payment_date?: string;
  sites?: any;
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // List payments (optionally with query params)
  getPayments(params?: { page?: number; limit?: number; status?: string; site_id?: number; start_date?: string; end_date?: string }): Observable<Payment[]> {
    const q: string[] = [];
    if (params) {
      if (params.page) q.push(`page=${params.page}`);
      if (params.limit) q.push(`limit=${params.limit}`);
      if (params.status) q.push(`status=${params.status}`);
      if (params.site_id) q.push(`site_id=${params.site_id}`);
      if (params.start_date) q.push(`start_date=${encodeURIComponent(params.start_date)}`);
      if (params.end_date) q.push(`end_date=${encodeURIComponent(params.end_date)}`);
    }
    const url = q.length ? `${this.apiUrl}?${q.join('&')}` : this.apiUrl;
    return this.http.get<Payment[]>(url);
  }

  // Paginated payments (returns pagination object)
  getPaginated(page: number = 1, limit: number = 25): Observable<PaginatedPayments> {
    return this.http.get<PaginatedPayments>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  // Get monthly summary
  getMonthlySummary(year?: number, month?: number) {
    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);
    return this.http.get(`${this.apiUrl}/monthly-summary?year=${y}&month=${m}`);
  }

  // Get payment analytics / stats
  getPaymentStatistics() {
    return this.http.get(`${this.apiUrl}/analytics`);
  }

  // Process payment
  processPayment(paymentId: number) {
    return this.http.patch(`${this.apiUrl}/${paymentId}/process`, {});
  }

  // Cancel payment (use update endpoint to set status cancelled)
  cancelPayment(paymentId: number) {
    return this.http.patch(`${this.apiUrl}/${paymentId}`, { status: 'cancelled' });
  }

  // Delete payment
  deletePayment(paymentId: number) {
    return this.http.delete(`${this.apiUrl}/${paymentId}`);
  }
}
