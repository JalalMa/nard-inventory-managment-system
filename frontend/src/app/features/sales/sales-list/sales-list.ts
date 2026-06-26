import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { Invoice as InvoiceModel } from '../../../core/models/sale.model';
import { Modal } from '../../../shared/components/modal/modal';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { Invoice } from '../invoice/invoice';
import { SalesService } from '../sales.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-sales-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, TranslatePipe, Modal, Pagination, Spinner, Invoice],
  templateUrl: './sales-list.html',
})
export class SalesList implements OnInit {
  private readonly sales$ = inject(SalesService);

  readonly invoices = signal<InvoiceModel[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly selected = signal<InvoiceModel | null>(null);
  private readonly page = signal(1);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.sales$
      .list({ page: this.page(), limit: PAGE_SIZE, sortDir: 'DESC' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((res) => {
        this.invoices.set(res.items);
        this.meta.set(res.meta);
      });
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  itemCount(invoice: InvoiceModel): number {
    return invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  open(invoice: InvoiceModel): void {
    this.selected.set(invoice);
  }

  close(): void {
    this.selected.set(null);
  }
}
