import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, finalize, startWith } from 'rxjs';
import { Category, UpsertCategory } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/components/confirm/confirm.service';
import { Modal } from '../../../shared/components/modal/modal';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { CategoryForm } from '../category-form/category-form';
import { CategoriesService } from '../categories.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe, Modal, Spinner, CategoryForm],
  templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {
  private readonly service = inject(CategoriesService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);

  readonly isManager = this.auth.isManager;
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<Category | null>(null);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(startWith(''), debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.load(term));
  }

  load(search: string): void {
    this.loading.set(true);
    this.service
      .list(search)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((categories) => this.categories.set(categories));
  }

  openCreate(): void {
    this.editing.set(null);
    this.modalOpen.set(true);
  }

  openEdit(category: Category): void {
    this.editing.set(category);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(payload: UpsertCategory): void {
    this.saving.set(true);
    const editing = this.editing();
    const request$ = editing
      ? this.service.update(editing.id, payload)
      : this.service.create(payload);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe(() => {
      this.notify.success(this.translate.instant('category.saved'));
      this.closeModal();
      this.load(this.searchControl.value);
    });
  }

  async remove(category: Category): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: this.translate.instant('category.deleteTitle'),
      message: this.translate.instant('category.deleteMessage', { name: category.name }),
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.service.remove(category.id).subscribe(() => {
      this.notify.success(this.translate.instant('category.deleted'));
      this.load(this.searchControl.value);
    });
  }
}
