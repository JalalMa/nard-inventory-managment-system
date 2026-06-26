import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../../core/models/pagination.model';
import { Product } from '../../core/models/product.model';
import { Invoice } from '../../core/models/sale.model';
import { toHttpParams } from '../../core/utils/http-params.util';

export interface DashboardCounts {
  productCount: number;
  salesCount: number;
}

/** Role-agnostic counts available to every authenticated user. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getCounts(): Observable<DashboardCounts> {
    const params = toHttpParams({ limit: 1 });
    return forkJoin({
      products: this.http.get<PaginatedResponse<Product>>(`${environment.apiUrl}/products`, {
        params,
      }),
      sales: this.http.get<PaginatedResponse<Invoice>>(`${environment.apiUrl}/sales`, { params }),
    }).pipe(
      map(({ products, sales }) => ({
        productCount: products.meta.total,
        salesCount: sales.meta.total,
      })),
    );
  }
}
