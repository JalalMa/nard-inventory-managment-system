import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Category, UpsertCategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './category-form.html',
})
export class CategoryForm {
  private readonly fb = inject(FormBuilder);

  readonly category = input<Category | null>(null);
  readonly saving = input(false);
  readonly save = output<UpsertCategory>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    // Patch the form whenever the edited category changes.
    effect(() => {
      const category = this.category();
      this.form.reset({ name: category?.name ?? '', description: category?.description ?? '' });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description } = this.form.getRawValue();
    this.save.emit({ name, description: description || undefined });
  }
}
