"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ensurePool,
  isChatConfigured,
  joinPool,
  listMembers,
  listMessages,
  sendMessage,
  subscribeMembers,
  subscribeMessages,
} from "./client";
import { createIdentity, loadIdentity, saveIdentity, updateDisplayName } from "./identity";
import type { ChatTarget, Identity, Member, Message, Pool } from "./types";

type Status = "idle" | "unconfigured" | "needs-name" | "connecting" | "ready" | "error";

type ChatCtx = {
  status: Status;
  configured: boolean;
  identity: Identity | null;
  pool: Pool | null;
  members: Member[];
  messages: Message[];
  target: ChatTarget;
  setTarget: (t: ChatTarget) => void;
  send: (body: string) => Promise<void>;
  openDM: (userId: string) => void;
  setDisplayName: (name: string) => void;
  error: string | null;
};

const Ctx = createContext<ChatCtx | null>(null);

export function useChat(): ChatCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useChat must be used inside <ChatProvider>");
  return c;
}

export function ChatProvider({
  poolSlug,
  poolName,
  children,
}: {
  poolSlug: string | null;
  poolName?: string | null;
  children: ReactNode;
}) {
  const configured = isChatConfigured();

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [target, setTarget] = useState<ChatTarget>({ kind: "pool" });
  const [error, setError] = useState<string | null>(null);

  // Hydrate identity from localStorage once.
  useEffect(() => {
    setIdentity(loadIdentity());
  }, []);

  const status: Status = useMemo(() => {
    if (!configured) return "unconfigured";
    if (!poolSlug) return "idle";
    if (!identity) return "needs-name";
    if (error) return "error";
    if (!pool) return "connecting";
    return "ready";
  }, [configured, poolSlug, identity, pool, error]);

  // Connect once we have slug + identity.
  const connectedSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!configured || !poolSlug || !identity) return;
    if (connectedSlugRef.current === poolSlug) return;
    connectedSlugRef.current = poolSlug;

    let cancelled = false;
    let unsubMsgs: (() => void) | null = null;
    let unsubMembers: (() => void) | null = null;

    (async () => {
      try {
        setError(null);
        const p = await ensurePool(poolSlug, poolName ?? null);
        if (cancelled) return;
        setPool(p);

        await joinPool(p.id, identity);
        if (cancelled) return;

        const [ms, msgs] = await Promise.all([listMembers(p.id), listMessages(p.id, identity.userId)]);
        if (cancelled) return;
        setMembers(ms);
        setMessages(msgs);

        unsubMsgs = subscribeMessages(p.id, (m) => {
          if (m.recipient_id && m.recipient_id !== identity.userId && m.author_id !== identity.userId) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        });
        unsubMembers = subscribeMembers(p.id, (m, kind) => {
          setMembers((prev) => {
            if (kind === "insert") {
              if (prev.some((x) => x.id === m.id)) return prev;
              return [...prev, m];
            }
            return prev.map((x) => (x.id === m.id ? m : x));
          });
        });
      } catch (e) {
        if (cancelled) return;
        connectedSlugRef.current = null;
        setError(e instanceof Error ? e.message : "chat connection failed");
      }
    })();

    return () => {
      cancelled = true;
      unsubMsgs?.();
      unsubMembers?.();
    };
  }, [configured, poolSlug, poolName, identity]);

  const send = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text || !pool || !identity) return;
      const recipientId = target.kind === "dm" ? target.userId : null;
      const msg = await sendMessage(pool.id, identity.userId, text, recipientId);
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    },
    [pool, identity, target],
  );

  const openDM = useCallback(
    (userId: string) => {
      if (!identity || userId === identity.userId) return;
      setTarget({ kind: "dm", userId });
    },
    [identity],
  );

  const setDisplayName = useCallback((name: string) => {
    setIdentity((prev) => {
      const next = prev ? updateDisplayName(prev, name) : createIdentity(name);
      saveIdentity(next);
      return next;
    });
  }, []);

  const value = useMemo<ChatCtx>(
    () => ({
      status,
      configured,
      identity,
      pool,
      members,
      messages,
      target,
      setTarget,
      send,
      openDM,
      setDisplayName,
      error,
    }),
    [status, configured, identity, pool, members, messages, target, send, openDM, setDisplayName, error],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
