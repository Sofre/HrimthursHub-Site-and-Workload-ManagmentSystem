import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import 'chart.js/auto';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentService, Payment } from '../../services/payment.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';

interface MonthStat { label: string; y: number; m: number; total: number }

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, TranslateModule, BaseChartDirective],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // reference to chart directive so we can trigger updates after async data
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  payments: Payment[] = [];
  loading = false;
  error = '';
  paymentsLoaded = false;

  // CSS-based chart properties
  months: MonthStat[] = [];
  maxMonthTotal = 1;
  totalLast6 = 0;
  avgLast6 = 0;
  highestMonth: MonthStat | null = null;

  // Chart.js properties
  barChartType: ChartType = 'bar';
  barChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Amount', data: [], backgroundColor: [] }] };
  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  };


  constructor(private router: Router, private paymentService: PaymentService, private cdr: ChangeDetectorRef, private authService: AuthService) {}

  ngOnInit() {
    // Attempt an immediate load (in case auth is already set)
    this.loadPayments();
    this.loadChart();

    // Ensure we reload when auth becomes available/ready (many components use this pattern)
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isAuthenticated) {
          console.debug('[PaymentsComponent] Authenticated, refreshing payments and chart');
          // Use refreshAll to refresh chart then payments
          this.refreshAll();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  async refreshAll() {
    this.loading = true;
    this.paymentsLoaded = false;
    // First update the chart (awaited), then reload payments list
    try {
      await this.loadChart();
    } catch (err) {
      console.error('Failed to refresh chart', err);
    }

    // Reload payments list
    this.loadPayments();

    // ensure the UI shows loading state while subscriptions complete
    if (this.cdr && typeof this.cdr.detectChanges === 'function') {
      this.cdr.detectChanges();
    } else {
      setTimeout(() => {}, 0);
    }

    // Return a small promise so callers can await if needed
    return Promise.resolve();
  }

  loadPayments() {
    this.loading = true;
    this.paymentService.getPayments({ limit: 25 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        console.debug('[PaymentsComponent] getPayments response:', data);
        const payload: any = data;
        this.payments = Array.isArray(payload) ? payload : (payload?.data || []);
        this.paymentsLoaded = true;
        this.loading = false;
        // ensure UI updates immediately after async response
        if (this.cdr && typeof this.cdr.detectChanges === 'function') {
          this.cdr.detectChanges();
        } else {
          // fallback: schedule an update in next macrotask
          setTimeout(() => {}, 0);
        }
      },
      error: (err) => {
        console.error('Failed to load payments', err);
        this.error = 'Failed to load payments';
        this.loading = false;
        if (this.cdr && typeof this.cdr.detectChanges === 'function') {
          this.cdr.detectChanges();
        } else {
          setTimeout(() => {}, 0);
        }
      }
    });
  }



  async loadChart() {
    // Build the last 6 months
    const now = new Date();
    const monthsReq: { y: number; m: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsReq.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: d.toLocaleString(undefined, { month: 'short', year: 'numeric' }) });
    }

    const results: MonthStat[] = [];
    for (const mo of monthsReq) {
      try {
        const resp: any = await firstValueFrom(this.paymentService.getMonthlySummary(mo.y, mo.m));
        console.debug('[PaymentsComponent] monthly-summary for', mo.label, resp);
        results.push({ label: mo.label, y: mo.y, m: mo.m, total: resp?.totalAmount || 0 });
      } catch (err) {
        console.error('Failed to load monthly summary for', mo, err);
        results.push({ label: mo.label, y: mo.y, m: mo.m, total: 0 });
      }
    }

    this.months = results;
    this.maxMonthTotal = Math.max(...this.months.map(x => x.total), 1);
    this.totalLast6 = this.months.reduce((s, x) => s + x.total, 0);
    this.avgLast6 = Math.round((this.totalLast6 / Math.max(1, this.months.length)) * 100) / 100;
    this.highestMonth = this.months.reduce((best: MonthStat | null, cur) => (!best || cur.total > best.total) ? cur : best, null);

    // populate chart.js data
    this.barChartData = {
      labels: this.months.map(m => m.label),
      datasets: [
        { label: 'Payments amount', data: this.months.map(m => m.total), backgroundColor: this.months.map(() => 'rgba(37,99,235,0.85)') }
      ]
    };

    // force change detection so bars and stats render immediately
    if (this.cdr && typeof this.cdr.detectChanges === 'function') {
      this.cdr.detectChanges();
    } else {
      setTimeout(() => {}, 0);
    }

    // ensure chart updates (Chart.js may need an explicit refresh after async data)
    setTimeout(() => {
      try {
        this.chart?.update();
      } catch (e) {
        // ignore if chart not yet initialized
        console.debug('Chart update skipped (not ready yet)', e);
      }
    }, 0);
  }
}