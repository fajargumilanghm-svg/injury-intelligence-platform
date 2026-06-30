import type { PostgrestError } from "@supabase/supabase-js";

export class SupabaseError extends Error {
  constructor(
    message: string,
    public context: string,
    public originalError?: any
  ) {
    super(`[${context}] ${message}`);
    this.name = 'SupabaseError';
  }
}

export function handleError(error: any, context: string): void {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw new SupabaseError(error.message || 'Unknown error', context, error);
  }
}

export function handleData<T>(data: any, error: any, context: string): T[] {
  handleError(error, context);
  return (data as T[]) ?? [];
}

export function handleSingle<T>(data: any, error: any, context: string): T | null {
  handleError(error, context);
  return (data as T) ?? null;
}
