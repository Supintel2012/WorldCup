export type Identity = {
  userId: string;
  displayName: string;
  avatar: string;
  accent: 1 | 2 | 3 | 4;
};

export type Pool = {
  id: string;
  slug: string;
  name: string | null;
  created_at: string;
};

export type Member = {
  id: string;
  pool_id: string;
  user_id: string;
  display_name: string;
  avatar: string | null;
  accent: 1 | 2 | 3 | 4;
  last_seen: string;
  created_at: string;
};

export type Message = {
  id: string;
  pool_id: string;
  author_id: string;
  recipient_id: string | null;
  body: string;
  created_at: string;
};

export type ChatTarget = { kind: "pool" } | { kind: "dm"; userId: string };
