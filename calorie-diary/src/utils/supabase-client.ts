// Supabase client utility
// This will work once Supabase connection is fully established

export const isSupabaseConnected = false;
export const supabaseUrl: string | null = null;
export const supabaseAnonKey: string | null = null;

export async function callCalculateCalories(foodName: string): Promise<number> {
  throw new Error('This utility is deprecated. Use direct Groq API calls instead.');
}

export async function saveDiaryEntry(date: string, entryData: any): Promise<void> {
  throw new Error('This utility is deprecated. Use Supabase client directly instead.');
}

export async function getDiaryEntry(date: string): Promise<any> {
  throw new Error('This utility is deprecated. Use Supabase client directly instead.');
}