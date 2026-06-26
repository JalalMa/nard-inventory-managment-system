/**
 * Application roles. `MANAGER` may mutate inventory/categories and view reports;
 * `EMPLOYEE` can browse products and process sales.
 */
export enum UserRole {
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}
