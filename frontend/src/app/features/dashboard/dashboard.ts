import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SalesReport, StockReport } from '../../core/models/report.model';
import { ReportsService } from '../reports/reports.service';
import { Spinner } from '../../shared/components/spinner/spinner';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { DashboardCounts, DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, TranslatePipe, Spinner, StatCard],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly reports = inject(ReportsService);

  readonly user = this.auth.currentUser;
  readonly isManager = this.auth.isManager;

  readonly loading = signal(true);
  readonly counts = signal<DashboardCounts | null>(null);
  readonly salesReport = signal<SalesReport | null>(null);
  readonly stockReport = signal<StockReport | null>(null);

  /** Largest daily revenue, used to scale the bar widths. */
  readonly maxDailyRevenue = computed(() =>
    Math.max(1, ...(this.salesReport()?.dailyRevenue.map((d) => d.revenue) ?? [])),
  );

  ngOnInit(): void {
    this.dashboardService.getCounts().subscribe((counts) => this.counts.set(counts));

    if (this.isManager()) {
      this.reports
        .getSalesReport()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((report) => this.salesReport.set(report));
      this.reports.getStockReport().subscribe((report) => this.stockReport.set(report));
    } else {
      this.loading.set(false);
    }
  }

  barWidth(revenue: number): string {
    return `${Math.round((revenue / this.maxDailyRevenue()) * 100)}%`;
  }
}
