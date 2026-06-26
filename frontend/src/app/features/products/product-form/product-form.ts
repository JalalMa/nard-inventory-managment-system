import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Category } from '../../../core/models/category.model';
import { Product, UpsertProduct } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private readonly fb = inject(FormBuilder);

  readonly product = input<Product | null>(null);
  readonly categories = input<Category[]>([]);
  readonly saving = input(false);
  readonly save = output<UpsertProduct>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const product = this.product();
      this.form.reset({
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price ?? 0,
        stockQuantity: product?.stockQuantity ?? 0,
        categoryId: product?.categoryId ?? 0,
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      name: value.name,
      description: value.description || undefined,
      price: value.price,
      stockQuantity: value.stockQuantity,
      categoryId: value.categoryId,
    });
  }
}
