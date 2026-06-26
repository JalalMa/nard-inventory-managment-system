import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SalesReport, StockReport } from '../../core/models/report.model';
import { toHttpParams } from '../../core/utils/http-params.util';

export interface SalesReportRange {
  startDate?: string;
  endDate?: string;
}

export interface StockReportParams {
  lowStockThreshold?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  getSalesReport(range: SalesReportRange = {}): Observable<SalesReport> {
    return this.http.get<SalesReport>(`${this.baseUrl}/sales`, { params: toHttpParams(range) });
  }

  getStockReport(params: StockReportParams = {}): Observable<StockReport> {
    return this.http.get<StockReport>(`${this.baseUrl}/stock`, { params: toHttpParams(params) });
  }
}
