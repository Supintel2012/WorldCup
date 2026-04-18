import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Identity, Member, Message, Pool } from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isChatConfigured(): boolean {
  if (!URL || !ANON) return false;
  if (URL.includes("<project-ref>") || ANON.startsWith("<")) return false;
  return true;
}

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (!isChatConfigured()) throw new Error("Supabase is not configured");
  if (_client) return _client;
  _client = createBrowserClient(URL!, ANON!);
  return _client;
}

export async function ensurePool(slug: string, name?: string | null): Promise<Pool> {
  const sb = client();
  const existing = await sb.from("chat_pools").select("*").eq("slug", slug).maybeSingle();
  if (existing.data) return existing.data as Pool;
  const inserted = await sb
    .from("chat_pools")
    .insert({ slug, name: name ?? null })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data as Pool;
}

export async function joinPool(poolId: string, id: Identity): Promise<Member> {
  const sb = client();
  const existing = await sb
    .from("chat_members")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", id.userId)
    .maybeSingle();
  if (existing.data) {
    const refreshed = await sb
      .from("chat_members")
      .update({ display_name: id.displayName, avatar: id.avatar, accent: id.accent, last_seen: new Date().toISOString() })
      .eq("id", (existing.data as Member).id)
      .select("*")
      .single();
    if (refreshed.error) throw refreshed.error;
    return refreshed.data as Member;
  }
  const inserted = await sb
    .from("chat_members")
    .insert({
      pool_id: poolId,
      user_id: id.userId,
      display_name: id.displayName,
      avatar: id.avatar,
      accent: id.accent,
    })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data as Member;
}

export async function listMembers(poolId: string): Promise<Member[]> {
  const sb = client();
  const { data, error } = await sb
    .from("chat_members")
    .select("*")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Member[]) ?? [];
}

export async function listMessages(poolId: string, myUserId: string): Promise<Message[]> {
  const sb = client();
  // Pull everything in the pool the current user can see: group (recipient null)
  // + DMs they authored or received. Capped to the last 200 for now.
  const { data, error } = await sb
    .from("chat_messages")
    .select("*")
    .eq("pool_id", poolId)
    .or(`recipient_id.is.null,author_id.eq.${myUserId},recipient_id.eq.${myUserId}`)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data as Message[]) ?? [];
}

export async function sendMessage(
  poolId: string,
  authorId: string,
  body: string,
  recipientId?: string | null,
): Promise<Message> {
  const sb = client();
  const { data, error } = await sb
    .from("chat_messages")
    .insert({ pool_id: poolId, author_id: authorId, recipient_id: recipientId ?? null, body })
    .select("*")
    .single();
  if (error) throw error;
  return data as Message;
}

export function subscribeMessages(poolId: string, onInsert: (m: Message) => void) {
  const sb = client();
  const channel = sb
    .channel(`chat:msgs:${poolId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `pool_id=eq.${poolId}` },
      (payload) => onInsert(payload.new as Message),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}

export function subscribeMembers(
  poolId: string,
  onChange: (m: Member, kind: "insert" | "update") => void,
) {
  const sb = client();
  const channel = sb
    .channel(`chat:members:${poolId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_members", filter: `pool_id=eq.${poolId}` },
      (payload) => onChange(payload.new as Member, "insert"),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "chat_members", filter: `pool_id=eq.${poolId}` },
      (payload) => onChange(payload.new as Member, "update"),
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
