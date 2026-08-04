"use client";

import { adminFetch } from "@/lib/admin-data-client";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_PLATFORM_SETTINGS,
  mergePlatformSettings,
  parsePlatformSettings,
  type PlatformSettings,
} from "@/lib/platform-data";

const LOCAL_SETTINGS_KEY = "alpha-admin-platform-settings";
const LOCAL_SAVED_AT_KEY = `${LOCAL_SETTINGS_KEY}:saved-at`;
const LOCAL_LOGO_KEY = `${LOCAL_SETTINGS_KEY}:logo-name`;

type PlatformSettingsResponse = {
  settings: PlatformSettings;
  updated_at: string | null;
};

function readLocalSettings(): Partial<PlatformSettings> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as Partial<PlatformSettings>) : {};
  } catch {
    return {};
  }
}

function writeLocalSettings(values: PlatformSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(values));
}

async function fetchSettingsFromSupabase(): Promise<PlatformSettingsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/admin/platform-settings", {
    headers,
    credentials: "same-origin",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string" ? payload.error : "Unable to load platform settings."
    );
  }

  return {
    settings: parsePlatformSettings(payload.settings),
    updated_at: payload.updated_at ?? null,
  };
}

async function saveSettingsToSupabase(values: PlatformSettings) {
  return adminFetch<{ settings: PlatformSettings; updated_at: string | null }>(
    "/api/admin/platform-settings",
    {
      method: "PATCH",
      body: JSON.stringify({ settings: values }),
    }
  );
}

export async function loadPlatformSettings(): Promise<PlatformSettingsResponse> {
  try {
    const remote = await fetchSettingsFromSupabase();
    writeLocalSettings(remote.settings);
    return remote;
  } catch (error) {
    console.warn("[platform-settings] falling back to local settings", error);
    const local = readLocalSettings();
    return {
      settings: mergePlatformSettings(local),
      updated_at: window.localStorage.getItem(LOCAL_SAVED_AT_KEY),
    };
  }
}

export async function savePlatformSettings(values: PlatformSettings) {
  writeLocalSettings(values);

  try {
    const saved = await saveSettingsToSupabase(values);
    return saved;
  } catch (error) {
    console.error("[platform-settings] save failed", error);
    throw error;
  }
}

export {
  DEFAULT_PLATFORM_SETTINGS,
  LOCAL_LOGO_KEY,
  LOCAL_SAVED_AT_KEY,
  mergePlatformSettings,
  type PlatformSettings,
};
