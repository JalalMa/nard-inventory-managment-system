import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../core/models/pagination.model';
import { CreateSale, Invoice, SaleQuery } from '../../core/models/sale.model';
import { toHttpParams } from '../../core/utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales`;

  checkout(payload: CreateSale): Observable<Invoice> {
    return this.http.post<Invoice>(this.baseUrl, payload);
  }

  list(query: SaleQuery): Observable<PaginatedResponse<Invoice>> {
    return this.http.get<PaginatedResponse<Invoice>>(this.baseUrl, { params: toHttpParams(query) });
  }

  get(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.baseUrl}/${id}`);
  }
}
