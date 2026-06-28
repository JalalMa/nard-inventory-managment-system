import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, finalize, startWith } from 'rxjs';
import { Product } from '../../core/models/product.model';
import { Invoice as InvoiceModel } from '../../core/models/sale.model';
import { NotificationService } from '../../core/services/notification.service';
import { SocketService } from '../../core/services/socket.service';
import { Modal } from '../../shared/components/modal/modal';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ProductsService } from '../products/products.service';
import { Invoice } from '../sales/invoice/invoice';
import { SalesService } from '../sales/sales.service';
import { CartService } from './cart.service';

@Component({
  selector: 'app-pos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CurrencyPipe, TranslatePipe, Modal, Spinner, Invoice],
  templateUrl: './pos.html',
})
export class Pos implements OnInit {
  private readonly products$ = inject(ProductsService);
  private readonly sales$ = inject(SalesService);
  private readonly notify = inject(NotificationService);
  private readonly socket = inject(SocketService);
  private readonly translate = inject(TranslateService);
  readonly cart = inject(CartService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly checkingOut = signal(false);
  readonly invoice = signal<InvoiceModel | null>(null);

  /** Reactive set of product ids currently in the cart, for highlighting the picker. */
  readonly cartProductIds = computed(() => new Set(this.cart.items().map((i) => i.product.id)));

  constructor() {
    // Keep the picker's stock figures live.
    this.socket
      .onStockUpdated()
      .pipe(takeUntilDestroyed())
      .subscribe(({ productId, stockQuantity }) =>
        this.products.update((list) =>
          list.map((p) => (p.id === productId ? { ...p, stockQuantity } : p)),
        ),
      );
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(startWith(''), debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.loadProducts(term));
  }

  loadProducts(search: string): void {
    this.loading.set(true);
    this.products$
      .list({ page: 1, limit: 24, search: search || undefined, sortBy: 'name', sortDir: 'ASC' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => this.products.set(res.items));
  }

  addToCart(product: Product): void {
    if (!this.cart.add(product)) {
      this.notify.info(this.translate.instant('pos.stockLimit', { name: product.name }));
    }
  }

  cartQuantity(productId: number): number {
    return this.cart.items().find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  changeQuantity(productId: number, quantity: number): void {
    this.cart.setQuantity(productId, quantity);
  }

  checkout(): void {
    if (this.cart.isEmpty() || this.checkingOut()) {
      return;
    }
    this.checkingOut.set(true);
    this.sales$
      .checkout(this.cart.toCreateSale())
      .pipe(finalize(() => this.checkingOut.set(false)))
      .subscribe((invoice) => {
        this.invoice.set(invoice);
        this.cart.clear();
        this.notify.success(this.translate.instant('pos.checkoutSuccess'));
        this.loadProducts(this.searchControl.value);
      });
  }

  newSale(): void {
    this.invoice.set(null);
  }
}
