import { computed, Injectable, signal } from '@angular/core';
import { Product } from '../../core/models/product.model';
import { CreateSale } from '../../core/models/sale.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Signal-based shopping cart. Quantities are clamped to available stock as a
 * first line of defence; the backend remains the source of truth at checkout.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().reduce((sum, i) => sum + i.quantity, 0));
  readonly total = computed(() =>
    Math.round(
      this.itemsSignal().reduce((sum, i) => sum + i.product.price * i.quantity, 0) * 100,
    ) / 100,
  );
  readonly isEmpty = computed(() => this.itemsSignal().length === 0);

  /** Adds one unit, or increments if already in the cart. Returns false if at stock cap. */
  add(product: Product): boolean {
    const existing = this.itemsSignal().find((i) => i.product.id === product.id);
    if (!existing) {
      if (product.stockQuantity < 1) {
        return false;
      }
      this.itemsSignal.update((items) => [...items, { product, quantity: 1 }]);
      return true;
    }
    if (existing.quantity >= product.stockQuantity) {
      return false;
    }
    return this.setQuantity(product.id, existing.quantity + 1);
  }

  setQuantity(productId: number, quantity: number): boolean {
    const item = this.itemsSignal().find((i) => i.product.id === productId);
    if (!item) {
      return false;
    }
    const clamped = Math.max(1, Math.min(quantity, item.product.stockQuantity));
    this.itemsSignal.update((items) =>
      items.map((i) => (i.product.id === productId ? { ...i, quantity: clamped } : i)),
    );
    return clamped === quantity;
  }

  remove(productId: number): void {
    this.itemsSignal.update((items) => items.filter((i) => i.product.id !== productId));
  }

  clear(): void {
    this.itemsSignal.set([]);
  }

  toCreateSale(): CreateSale {
    return {
      items: this.itemsSignal().map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    };
  }
}
