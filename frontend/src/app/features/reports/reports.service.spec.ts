import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the sales report with a date range', () => {
    service.getSalesReport({ startDate: '2026-01-01', endDate: '2026-02-01' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/reports/sales`);
    expect(req.request.params.get('startDate')).toBe('2026-01-01');
    expect(req.request.params.get('endDate')).toBe('2026-02-01');
    req.flush({});
  });

  it('requests the stock report without params by default', () => {
    service.getStockReport().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/reports/stock`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });
});
