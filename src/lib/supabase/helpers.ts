import type { PostgrestError } from "@supabase/supabase-js";

export function handleError(error: PostgrestError | null, context: string) {
  if (error) {
    console.error(`[Supabase Error] ${context}:`, error.message, error.details, error.hint);
  }
}

export function handleData<T>(data: T | null, error: PostgrestError | null, context: string): T[] {
  handleError(error, context);
  return (data ?? []) as T[];
}

export function handleSingle<T>(data: T | null, error: PostgrestError | null, context: string): T | null {
  handleError(error, context);
  return data;
}
