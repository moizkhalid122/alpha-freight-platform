"use client";

import { supabase } from "@/lib/supabase";
import { parseProfileExtras } from "@/lib/platform-data";
import type {
  CarrierProfileExtras,
  SupplierProfileExtras,
} from "@/lib/profile-extras-types";
import {
  getCarrierExtrasKey,
  getSupplierExtrasKey,
} from "@/lib/profile-extras-types";

export type {
  CarrierProfileExtras,
  SupplierProfileExtras,
} from "@/lib/profile-extras-types";

export {
  getCarrierExtrasKey,
  getSupplierExtrasKey,
} from "@/lib/profile-extras-types";

const carrierCache = new Map<string, CarrierProfileExtras>();
const supplierCache = new Map<string, SupplierProfileExtras>();
const hydrationPromises = new Map<string, Promise<void>>();

const readLocalExtras = <T,>(storageKey: string): T => {
  if (typeof window === "undefined") return {} as T;

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? (JSON.parse(rawValue) as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

const writeLocalExtras = <T,>(storageKey: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

function setCarrierCache(userId: string, extras: CarrierProfileExtras) {
  carrierCache.set(userId, extras);
}

function setSupplierCache(userId: string, extras: SupplierProfileExtras) {
  supplierCache.set(userId, extras);
}

export const readCarrierExtras = (userId: string): CarrierProfileExtras => {
  if (carrierCache.has(userId)) {
    return carrierCache.get(userId)!;
  }
  const local = readLocalExtras<CarrierProfileExtras>(getCarrierExtrasKey(userId));
  if (Object.keys(local).length > 0) {
    carrierCache.set(userId, local);
  }
  return local;
};

export const readSupplierExtras = (userId: string): SupplierProfileExtras => {
  if (supplierCache.has(userId)) {
    return supplierCache.get(userId)!;
  }
  const local = readLocalExtras<SupplierProfileExtras>(getSupplierExtrasKey(userId));
  if (Object.keys(local).length > 0) {
    supplierCache.set(userId, local);
  }
  return local;
};

export function resolveCarrierExtras(
  userId: string,
  profileExtras?: unknown
): CarrierProfileExtras {
  const fromDb = parseProfileExtras<CarrierProfileExtras>(profileExtras);
  if (Object.keys(fromDb).length > 0) {
    setCarrierCache(userId, fromDb);
    return fromDb;
  }
  return readCarrierExtras(userId);
}

export function resolveSupplierExtras(
  userId: string,
  profileExtras?: unknown
): SupplierProfileExtras {
  const fromDb = parseProfileExtras<SupplierProfileExtras>(profileExtras);
  if (Object.keys(fromDb).length > 0) {
    setSupplierCache(userId, fromDb);
    return fromDb;
  }
  return readSupplierExtras(userId);
}

async function persistProfileExtras(userId: string, extras: Record<string, unknown>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === userId) {
    const { error } = await supabase
      .from("profiles")
      .update({ profile_extras: extras })
      .eq("id", userId);

    if (!error) return;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`/api/admin/profiles/${userId}/extras`, {
      method: "PATCH",
      headers,
      credentials: "same-origin",
      body: JSON.stringify({ profile_extras: extras }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(
        typeof payload?.error === "string" ? payload.error : "Unable to save profile extras."
      );
    }
  } catch (error) {
    console.error("[profile-extras] persist failed", error);
  }
}

export const writeCarrierExtras = (userId: string, extras: CarrierProfileExtras) => {
  setCarrierCache(userId, extras);
  writeLocalExtras(getCarrierExtrasKey(userId), extras);
  void persistProfileExtras(userId, extras);
};

export const writeSupplierExtras = (userId: string, extras: SupplierProfileExtras) => {
  setSupplierCache(userId, extras);
  writeLocalExtras(getSupplierExtrasKey(userId), extras);
  void persistProfileExtras(userId, extras);
};

export const mergeCarrierExtras = (userId: string, extras: Partial<CarrierProfileExtras>) => {
  const nextValue = {
    ...readCarrierExtras(userId),
    ...extras,
  };
  writeCarrierExtras(userId, nextValue);
  return nextValue;
};

export const mergeSupplierExtras = (userId: string, extras: Partial<SupplierProfileExtras>) => {
  const nextValue = {
    ...readSupplierExtras(userId),
    ...extras,
  };
  writeSupplierExtras(userId, nextValue);
  return nextValue;
};

export async function hydrateProfileExtras(userId: string, roleHint?: "carrier" | "supplier") {
  const cacheKey = `${roleHint ?? "any"}:${userId}`;
  if (hydrationPromises.has(cacheKey)) {
    return hydrationPromises.get(cacheKey);
  }

  const task = (async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("profile_extras, role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return;

    const role = roleHint ?? (data.role === "supplier" ? "supplier" : "carrier");
    const dbExtras = parseProfileExtras(data.profile_extras);

    if (Object.keys(dbExtras).length > 0) {
      if (role === "supplier") {
        setSupplierCache(userId, dbExtras as SupplierProfileExtras);
      } else {
        setCarrierCache(userId, dbExtras as CarrierProfileExtras);
      }
      return;
    }

    const local =
      role === "supplier"
        ? readLocalExtras<SupplierProfileExtras>(getSupplierExtrasKey(userId))
        : readLocalExtras<CarrierProfileExtras>(getCarrierExtrasKey(userId));

    if (Object.keys(local).length === 0) return;

    if (role === "supplier") {
      setSupplierCache(userId, local as SupplierProfileExtras);
    } else {
      setCarrierCache(userId, local as CarrierProfileExtras);
    }

    await persistProfileExtras(userId, local as Record<string, unknown>);
  })();

  hydrationPromises.set(cacheKey, task);
  try {
    await task;
  } finally {
    hydrationPromises.delete(cacheKey);
  }
}

export async function writeCarrierExtrasAsync(userId: string, extras: CarrierProfileExtras) {
  writeCarrierExtras(userId, extras);
  await persistProfileExtras(userId, extras);
}

export async function writeSupplierExtrasAsync(userId: string, extras: SupplierProfileExtras) {
  writeSupplierExtras(userId, extras);
  await persistProfileExtras(userId, extras);
}
