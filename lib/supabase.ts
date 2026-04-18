import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => createBrowserClient(URL, ANON);

export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // called from a Server Component; safe to ignore if middleware refreshes
        }
      },
      remove: (name: string, options: CookieOptions) => {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {}
      },
    },
  });
}

export function createAdminSupabase() {
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!svc) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createServerClient(URL, svc, {
    cookies: { get: () => undefined, set: () => {}, remove: () => {} },
  });
}
