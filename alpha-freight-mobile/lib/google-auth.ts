import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import * as WebBrowser from "expo-web-browser";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppRole, getUserRole, roleMismatchMessage } from "@/lib/user-role";

WebBrowser.maybeCompleteAuthSession();

export type GoogleAuthMode = "login" | "signup";

type GoogleAuthOptions = {
  role: AppRole;
  mode: GoogleAuthMode;
  onCompleting?: () => void;
};

type GoogleAuthResult =
  | { ok: true; isNewUser: boolean }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string };

let googleConfigured = false;

function useNativeGoogleAuth() {
  return Boolean(Constants.expoConfig?.extra?.googleNativeAuthEnabled);
}

function getGoogleWebClientId() {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    Constants.expoConfig?.extra?.googleWebClientId ??
    ""
  );
}

function configureGoogleSignIn() {
  if (googleConfigured) return;

  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    throw new Error("Google Web Client ID is missing. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });

  googleConfigured = true;
}

export function getGoogleAuthRedirectUri() {
  return makeRedirectUri({
    scheme: "alphafreight",
    path: "auth/callback",
  });
}

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(String(errorCode));
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: String(params.access_token),
      refresh_token: String(params.refresh_token),
    });
    if (error) throw error;
    return;
  }

  const code = params.code ? String(params.code) : null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  throw new Error("Google sign in did not return a valid session.");
}

function fullNameFromUser(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const metadataName = [user.user_metadata?.full_name, user.user_metadata?.name]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);

  if (metadataName) return metadataName;
  const emailPrefix = String(user.email ?? "").split("@")[0]?.trim();
  return emailPrefix || "Alpha Freight User";
}

async function ensureGoogleProfile(userId: string, role: AppRole) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.id) {
    return { isNewUser: false, role: existing.role as AppRole };
  }

  const fullName = fullNameFromUser(user);
  const { error: profileError } = await supabase.from("profiles").upsert([
    {
      id: userId,
      full_name: fullName,
      role,
      created_at: new Date().toISOString(),
      verification_status: "pending",
      is_approved: false,
    },
  ]);

  if (profileError) throw profileError;

  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      role,
    },
  });

  return { isNewUser: true, role };
}

async function finalizeGoogleSession(
  role: AppRole,
  mode: GoogleAuthMode
): Promise<GoogleAuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Google sign in did not create a session.");
  }

  const profile = await ensureGoogleProfile(user.id, role);
  const actualRole = await getUserRole(user.id);
  const mismatch = roleMismatchMessage(role, actualRole);

  if (mismatch && !profile.isNewUser) {
    await supabase.auth.signOut();
    throw new Error(mismatch);
  }

  if (profile.isNewUser) {
    return { ok: true, isNewUser: true };
  }

  return { ok: true, isNewUser: false };
}

async function signInWithGoogleBrowser({
  role,
  mode,
  onCompleting,
}: GoogleAuthOptions): Promise<GoogleAuthResult> {
  const redirectTo = getGoogleAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    return { ok: false, cancelled: false, error: error.message };
  }

  if (!data?.url) {
    return { ok: false, cancelled: false, error: "Unable to start Google sign in." };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
    createTask: false,
  });

  if (result.type === "cancel" || result.type === "dismiss") {
    return { ok: false, cancelled: true };
  }

  if (result.type !== "success") {
    return { ok: false, cancelled: false, error: "Google sign in was interrupted." };
  }

  onCompleting?.();

  try {
    await createSessionFromUrl(result.url);
    return finalizeGoogleSession(role, mode);
  } catch (err) {
    await supabase.auth.signOut().catch(() => undefined);
    return {
      ok: false,
      cancelled: false,
      error: err instanceof Error ? err.message : "Unable to sign in with Google.",
    };
  }
}

async function signInWithGoogleNative({
  role,
  mode,
  onCompleting,
}: GoogleAuthOptions): Promise<GoogleAuthResult> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;

  if (!idToken) {
    return { ok: false, cancelled: false, error: "Google did not return a sign-in token." };
  }

  onCompleting?.();

  const { error: authError } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  if (authError) throw authError;

  return finalizeGoogleSession(role, mode);
}

export async function signInWithGoogle(options: GoogleAuthOptions): Promise<GoogleAuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, cancelled: false, error: "Supabase keys missing in .env" };
  }

  if (!useNativeGoogleAuth()) {
    return signInWithGoogleBrowser(options);
  }

  try {
    return await signInWithGoogleNative(options);
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
    const message = err instanceof Error ? err.message : "Unable to sign in with Google.";

    if (code === statusCodes.SIGN_IN_CANCELLED) {
      return { ok: false, cancelled: true };
    }

    if (message.includes("DEVELOPER_ERROR") || code === "10") {
      return signInWithGoogleBrowser(options);
    }

    await supabase.auth.signOut().catch(() => undefined);
    return { ok: false, cancelled: false, error: message };
  }
}

export async function handleOAuthCallbackUrl(url: string) {
  await createSessionFromUrl(url);
}
