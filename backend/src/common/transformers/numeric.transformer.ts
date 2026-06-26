import { ValueTransformer } from 'typeorm';

/**
 * MySQL returns DECIMAL columns as strings to preserve precision. This
 * transformer keeps the TypeScript surface as `number` while persisting safely.
 */
export class ColumnNumericTransformer implements ValueTransformer {
  to(value: number): number {
    return value;
  }

  from(value: string | null): number | null {
    return value === null ? null : parseFloat(value);
  }
}
