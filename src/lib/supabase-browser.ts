export type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
  };
};

const sessionKey = "business_cmd_supabase_session";

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function supabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

function requireConfig() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();

  if (!url || !key) {
    throw new Error("Missing Supabase config. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as SupabaseSession;
    if (!session?.access_token || !session.user?.id) {
      window.localStorage.removeItem(sessionKey);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

export function storeSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(sessionKey);
    return;
  }

  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.msg || body?.message || body?.error_description || "Supabase request failed");
  }

  return body as T;
}

export async function signUp(email: string, password: string) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<SupabaseSession>(response);
}

export async function signIn(email: string, password: string) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<SupabaseSession>(response);
}

export async function signOut(session: SupabaseSession | null) {
  const { url, key } = requireConfig();
  if (session?.access_token) {
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => null);
  }

  storeSession(null);
}

export async function restSelect<T>(session: SupabaseSession, path: string) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return parseResponse<T>(response);
}

export async function restInsert<T>(session: SupabaseSession, table: string, data: unknown) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });

  return parseResponse<T>(response);
}

export async function restUpdate<T>(session: SupabaseSession, path: string, data: unknown) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });

  return parseResponse<T>(response);
}

export async function restDelete(session: SupabaseSession, path: string) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return parseResponse<unknown>(response);
}
