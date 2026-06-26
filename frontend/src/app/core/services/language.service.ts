import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

export type AppLanguage = 'en' | 'ar';

interface LanguageMeta {
  code: AppLanguage;
  label: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

const DEFAULT_LANGUAGE: AppLanguage = 'en';

/** Owns the active language, persistence, and document direction (RTL/LTR). */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);
  private readonly currentSignal = signal<AppLanguage>(DEFAULT_LANGUAGE);
  readonly current = this.currentSignal.asReadonly();

  readonly languages = SUPPORTED_LANGUAGES;

  /** Called once at startup to apply the persisted (or default) language. */
  init(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.language) as AppLanguage | null;
    this.use(stored && this.isSupported(stored) ? stored : DEFAULT_LANGUAGE);
  }

  use(code: AppLanguage): void {
    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
    this.translate.use(meta.code);
    this.currentSignal.set(meta.code);
    localStorage.setItem(STORAGE_KEYS.language, meta.code);

    const html = this.document.documentElement;
    html.setAttribute('lang', meta.code);
    html.setAttribute('dir', meta.dir);
  }

  toggle(): void {
    this.use(this.currentSignal() === 'en' ? 'ar' : 'en');
  }

  private isSupported(code: string): code is AppLanguage {
    return SUPPORTED_LANGUAGES.some((l) => l.code === code);
  }
}
