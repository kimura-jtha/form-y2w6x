/**
 * Common shared types
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;
