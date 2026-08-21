"use client";

import { commercialDirectorFetch } from "@/lib/commercial-director-data-client";

/** Return whichever succeeds first — API cache or direct Supabase in the browser. */
export async function commercialDirectorFetchResilient<T>(
  path: string,
  fallback: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let errors = 0;

    const finish = (value: T) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const fail = (error: unknown) => {
      errors += 1;
      if (errors >= 2 && !settled) {
        settled = true;
        reject(error instanceof Error ? error : new Error("Commercial Director data request failed."));
      }
    };

    commercialDirectorFetch<T>(path).then(finish).catch(fail);
    fallback().then(finish).catch(fail);
  });
}
