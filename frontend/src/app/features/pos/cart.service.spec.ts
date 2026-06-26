import { Product } from '../../core/models/product.model';
import { CartService } from './cart.service';

describe('CartService', () => {
  let cart: CartService;

  const product = (id: number, price: number, stock: number): Product =>
    ({ id, name: `P${id}`, price, stockQuantity: stock }) as Product;

  beforeEach(() => {
    cart = new CartService();
  });

  it('adds new items and increments existing ones', () => {
    const p = product(1, 2.5, 10);
    cart.add(p);
    cart.add(p);
    expect(cart.count()).toBe(2);
    expect(cart.items().length).toBe(1);
  });

  it('computes the total from price × quantity', () => {
    cart.add(product(1, 2.5, 10));
    cart.add(product(1, 2.5, 10));
    cart.add(product(2, 4, 10));
    expect(cart.total()).toBe(9);
  });

  it('refuses to exceed available stock', () => {
    const p = product(1, 1, 1);
    expect(cart.add(p)).toBe(true);
    expect(cart.add(p)).toBe(false);
    expect(cart.count()).toBe(1);
  });

  it('does not add an out-of-stock product', () => {
    expect(cart.add(product(1, 1, 0))).toBe(false);
    expect(cart.isEmpty()).toBe(true);
  });

  it('clamps quantity to the stock ceiling', () => {
    cart.add(product(1, 1, 5));
    const ok = cart.setQuantity(1, 99);
    expect(ok).toBe(false);
    expect(cart.count()).toBe(5);
  });

  it('builds the checkout payload', () => {
    cart.add(product(1, 1, 5));
    cart.add(product(2, 1, 5));
    expect(cart.toCreateSale()).toEqual({
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 1 },
      ],
    });
  });
});
