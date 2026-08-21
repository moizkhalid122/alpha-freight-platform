import dns from "node:dns";

/** Fixes intermittent Supabase / external API timeouts on some Windows networks. */
dns.setDefaultResultOrder("ipv4first");

type RestConfig = {
  url: string;
  key: string;
};

function getRestConfig(): RestConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase service role is not configured.");
  }
  return { url, key };
}

async function supabaseFetch(
  endpoint: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(endpoint, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function supabaseHttpsGet<T>(
  table: string,
  query: string,
  timeoutMs = 12_000
): Promise<{ data: T; error: string | null }> {
  try {
    const { url, key } = getRestConfig();
    const endpoint = `${url}/rest/v1/${table}?${query}`;
    const response = await supabaseFetch(
      endpoint,
      {
        method: "GET",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
      },
      timeoutMs
    );

    const body = await response.text();
    if (!response.ok) {
      return { data: [] as T, error: body || `HTTP ${response.status}` };
    }

    try {
      return { data: JSON.parse(body) as T, error: null };
    } catch {
      return { data: [] as T, error: "Invalid JSON response" };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return {
      data: [] as T,
      error: message.includes("abort") ? "timeout" : message,
    };
  }
}

export async function supabaseHttpsCount(
  table: string,
  query: string,
  timeoutMs = 12_000
): Promise<{ count: number; error: string | null }> {
  try {
    const { url, key } = getRestConfig();
    const endpoint = `${url}/rest/v1/${table}?${query}`;
    const response = await supabaseFetch(
      endpoint,
      {
        method: "GET",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
          Prefer: "count=exact",
          Range: "0-0",
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      return { count: 0, error: `HTTP ${response.status}` };
    }

    const range = String(response.headers.get("content-range") ?? "");
    const total = range.split("/")[1];
    const count = total && total !== "*" ? Number(total) : 0;
    return { count: Number.isFinite(count) ? count : 0, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return {
      count: 0,
      error: message.includes("abort") ? "timeout" : message,
    };
  }
}

export async function supabaseHttpsDelete(
  table: string,
  query: string,
  timeoutMs = 15_000
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { url, key } = getRestConfig();
    const endpoint = `${url}/rest/v1/${table}?${query}`;
    const response = await supabaseFetch(
      endpoint,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: body || `HTTP ${response.status}` };
    }

    return { ok: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return {
      ok: false,
      error: message.includes("abort") ? "timeout" : message,
    };
  }
}

export async function supabaseAuthDeleteUser(
  userId: string,
  timeoutMs = 20_000
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { url, key } = getRestConfig();
    const endpoint = `${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
    const response = await supabaseFetch(
      endpoint,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
      },
      timeoutMs
    );

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: body || `HTTP ${response.status}` };
    }

    return { ok: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return {
      ok: false,
      error: message.includes("abort") ? "timeout" : message,
    };
  }
}
