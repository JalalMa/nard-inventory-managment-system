import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Invoice as InvoiceModel } from '../../../core/models/sale.model';

/** Printable invoice. The `.print-area` class scopes what `window.print()` outputs. */
@Component({
  selector: 'app-invoice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, TranslatePipe],
  templateUrl: './invoice.html',
})
export class Invoice {
  readonly invoice = input.required<InvoiceModel>();

  /** Hide the built-in print button when the host provides its own actions row. */
  readonly showPrint = input(true);

  print(): void {
    window.print();
  }
}
