export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCategory {
  name: string;
  description?: string;
}
