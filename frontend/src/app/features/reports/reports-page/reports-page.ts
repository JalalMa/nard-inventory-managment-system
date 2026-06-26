import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { SalesReport, StockReport } from '../../../core/models/report.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { ReportsService } from '../reports.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, TranslatePipe, Spinner, StatCard],
  templateUrl: './reports-page.html',
})
export class ReportsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reports = inject(ReportsService);

  readonly salesReport = signal<SalesReport | null>(null);
  readonly stockReport = signal<StockReport | null>(null);
  readonly loadingSales = signal(false);
  readonly loadingStock = signal(false);

  readonly range = this.fb.nonNullable.group({ startDate: '', endDate: '' });

  readonly maxDailyRevenue = computed(() =>
    Math.max(1, ...(this.salesReport()?.dailyRevenue.map((d) => d.revenue) ?? [])),
  );

  ngOnInit(): void {
    this.loadSales();
    this.loadStock();
  }

  loadSales(): void {
    this.loadingSales.set(true);
    const { startDate, endDate } = this.range.getRawValue();
    this.reports
      .getSalesReport({ startDate: startDate || undefined, endDate: endDate || undefined })
      .pipe(finalize(() => this.loadingSales.set(false)))
      .subscribe((report) => this.salesReport.set(report));
  }

  resetRange(): void {
    this.range.reset({ startDate: '', endDate: '' });
    this.loadSales();
  }

  private loadStock(): void {
    this.loadingStock.set(true);
    this.reports
      .getStockReport()
      .pipe(finalize(() => this.loadingStock.set(false)))
      .subscribe((report) => this.stockReport.set(report));
  }

  barWidth(revenue: number): string {
    return `${Math.round((revenue / this.maxDailyRevenue()) * 100)}%`;
  }
}
