import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('serializes query params and omits empty values', () => {
    service
      .list({ page: 2, limit: 10, search: 'cola', categoryId: 3, minPrice: undefined })
      .subscribe();
    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/products`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('search')).toBe('cola');
    expect(req.request.params.get('categoryId')).toBe('3');
    expect(req.request.params.has('minPrice')).toBe(false);
    req.flush({ items: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } });
  });

  it('creates a product via POST', () => {
    const payload = { name: 'Tea', price: 2, stockQuantity: 5, categoryId: 1 };
    service.create(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload });
  });

  it('deletes a product via DELETE', () => {
    service.remove(9).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/products/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
