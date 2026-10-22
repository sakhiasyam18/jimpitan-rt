import { cookies } from 'next/headers';
import { createClient as createClientWithCookies } from '@/utils/supabase/server';

export async function createClient() {
  const cookieStore = await cookies();
  return createClientWithCookies(cookieStore);
}
