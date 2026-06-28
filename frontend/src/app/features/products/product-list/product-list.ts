import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { Product, ProductQuery, UpsertProduct } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { ConfirmService } from '../../../shared/components/confirm/confirm.service';
import { Modal } from '../../../shared/components/modal/modal';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { CategoriesService } from '../../categories/categories.service';
import { ProductForm } from '../product-form/product-form';
import { ProductsService } from '../products.service';

const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 10;

@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CurrencyPipe, TranslatePipe, Modal, Pagination, Spinner, ProductForm],
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly products$ = inject(ProductsService);
  private readonly categories$ = inject(CategoriesService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly socket = inject(SocketService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly DEFAULT_SORT = 'createdAt:DESC';

  readonly isManager = this.auth.isManager;
  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  readonly products = signal<Product[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<Product | null>(null);

  private readonly page = signal(1);

  readonly filters = this.fb.group({
    search: this.fb.nonNullable.control(''),
    categoryId: this.fb.control<number | null>(null),
    minPrice: this.fb.control<number | null>(null),
    maxPrice: this.fb.control<number | null>(null),
    sort: this.fb.nonNullable.control('createdAt:DESC'),
  });

  readonly livePatched = signal<number | null>(null);

  constructor() {
    // Live stock updates: patch the matching row in place when the server broadcasts.
    this.socket
      .onStockUpdated()
      .pipe(takeUntilDestroyed())
      .subscribe(({ productId, stockQuantity }) => {
        this.products.update((list) =>
          list.map((p) => (p.id === productId ? { ...p, stockQuantity } : p)),
        );
        this.flashRow(productId);
      });
  }

  ngOnInit(): void {
    this.categories$.list().subscribe((categories) => this.categories.set(categories));

    // The URL is the single source of truth: react to query params → sync the
    // form, then load. This also covers refresh, deep links and back/forward.
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filters.patchValue(
        {
          search: (params['search'] as string) ?? '',
          categoryId: this.toNumber(params['categoryId']),
          minPrice: this.toNumber(params['minPrice']),
          maxPrice: this.toNumber(params['maxPrice']),
          sort: (params['sort'] as string) ?? ProductList.DEFAULT_SORT,
        },
        { emitEvent: false },
      );
      this.page.set(this.toPage(params['page']));
      this.load();
    });

    // Filter edits update the URL (resetting to page 1); the subscription above reloads.
    this.filters.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncUrl(1));
  }

  load(): void {
    this.loading.set(true);
    this.products$
      .list(this.buildQuery())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        this.products.set(res.items);
        this.meta.set(res.meta);
      });
  }

  onPageChange(page: number): void {
    this.syncUrl(page);
  }

  isRecentlyPatched(id: number): boolean {
    return this.livePatched() === id;
  }

  openCreate(): void {
    this.editing.set(null);
    this.modalOpen.set(true);
  }

  openEdit(product: Product): void {
    this.editing.set(product);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(payload: UpsertProduct): void {
    this.saving.set(true);
    const editing = this.editing();
    const request$ = editing
      ? this.products$.update(editing.id, payload)
      : this.products$.create(payload);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.notify.success(this.translate.instant('product.saved'));
      this.closeModal();
      this.load();
    });
  }

  async remove(product: Product): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: this.translate.instant('product.deleteTitle'),
      message: this.translate.instant('product.deleteMessage', { name: product.name }),
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.products$.remove(product.id).subscribe(() => {
      this.notify.success(this.translate.instant('product.deleted'));
      this.load();
    });
  }

  private buildQuery(): ProductQuery {
    const f = this.filters.getRawValue();
    const [sortBy, sortDir] = f.sort.split(':');
    return {
      page: this.page(),
      limit: PAGE_SIZE,
      search: f.search || undefined,
      categoryId: f.categoryId ?? undefined,
      minPrice: f.minPrice ?? undefined,
      maxPrice: f.maxPrice ?? undefined,
      sortBy,
      sortDir: sortDir as 'ASC' | 'DESC',
    };
  }

  /** Writes the current filters + page to the URL (empty values are omitted for clean links). */
  private syncUrl(page: number): void {
    const f = this.filters.getRawValue();
    const queryParams = this.dropEmpty({
      search: f.search || null,
      categoryId: f.categoryId,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      sort: f.sort !== ProductList.DEFAULT_SORT ? f.sort : null,
      page: page > 1 ? page : null,
    });
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  private dropEmpty(obj: Record<string, string | number | null>): Params {
    const out: Params = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        out[key] = value;
      }
    }
    return out;
  }

  private toNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private toPage(value: unknown): number {
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  private flashRow(productId: number): void {
    this.livePatched.set(productId);
    setTimeout(() => {
      if (this.livePatched() === productId) {
        this.livePatched.set(null);
      }
    }, 1500);
  }
}
