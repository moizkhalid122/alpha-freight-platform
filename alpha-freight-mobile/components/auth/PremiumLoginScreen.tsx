import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { useGoogleAuthFlow } from "@/lib/use-google-auth-flow";
import { markWelcomeCompleted } from "@/lib/onboarding";
import { initializePushNotifications } from "@/lib/push-notifications";
import { routeAfterAuth } from "@/lib/pin-routing";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getUserRole, roleMismatchMessage } from "@/lib/user-role";
import { colors, radius, spacing } from "@/lib/theme";

type Role = "carrier" | "supplier";
type Step = "email" | "password";

function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.orText}>or</Text>
      <View style={styles.orLine} />
    </View>
  );
}

export default function PremiumLoginScreen() {
  const [role, setRole] = useState<Role>("carrier");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { finishGoogleAuth } = useGoogleAuthFlow();

  const canContinueEmail = email.trim().length > 3 && email.includes("@");
  const canSignIn = password.trim().length >= 6;

  const handleContinue = () => {
    setError(null);
    if (!canContinueEmail) {
      setError("Enter a valid email address.");
      return;
    }
    setStep("password");
  };

  const handleSignIn = async () => {
    setError(null);

    if (!canSignIn) {
      setError("Enter your password.");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase keys missing in .env");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (userId) {
        const profileRole = await getUserRole(userId);
        const mismatch = roleMismatchMessage(role, profileRole);
        if (mismatch) {
          await supabase.auth.signOut();
          throw new Error(mismatch);
        }
      }

      await markWelcomeCompleted();
      await routeAfterAuth();
      setTimeout(() => {
        void initializePushNotifications();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await finishGoogleAuth({
      role,
      mode: "login",
      onError: setError,
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.content}>
            <View style={styles.centerWrap}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
              <View style={styles.roleTabs}>
                {(["carrier", "supplier"] as Role[]).map((item) => {
                  const active = role === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setRole(item)}
                      hitSlop={8}
                      style={({ pressed }) => [pressed && styles.pressedSoft]}
                    >
                      <Text style={[styles.roleTab, active && styles.roleTabActive]}>
                        {item === "carrier" ? "Carrier" : "Supplier"}
                      </Text>
                      {active ? <View style={styles.roleUnderline} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {step === "email" ? (
              <Animated.View
                key="email-step"
                entering={FadeInDown.duration(420).delay(60)}
                exiting={FadeOut.duration(200)}
                style={styles.formBlock}
              >
                <Text style={styles.title}>Log in</Text>
                <Text style={styles.subtitle}>Enter your email address</Text>

                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setError(null);
                    setEmail(text);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="name@company.com"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.input}
                  returnKeyType="next"
                  onSubmitEditing={handleContinue}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.buttonPrimary,
                    !canContinueEmail && styles.buttonPrimaryMuted,
                    pressed && canContinueEmail && styles.buttonPrimaryPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={loading || !canContinueEmail}
                >
                  <Text style={styles.buttonPrimaryText}>Continue</Text>
                </Pressable>

                <OrDivider />

                <GoogleAuthButton
                  label="Continue with Google"
                  disabled={loading}
                  onPress={() => void handleGoogleSignIn()}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="password-step"
                entering={FadeInDown.duration(420)}
                exiting={FadeOut.duration(200)}
                style={styles.formBlock}
              >
                <Pressable onPress={() => setStep("email")} hitSlop={8}>
                  <Text style={styles.back}>← {email.trim()}</Text>
                </Pressable>

                <Text style={styles.title}>Enter your password</Text>
                <Text style={styles.subtitle}>Sign in to your {role} account</Text>

                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setError(null);
                    setPassword(text);
                  }}
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor={colors.mutedLight}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSignIn()}
                  autoFocus
                />

                <Pressable style={styles.forgot}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.buttonPrimary,
                    !canSignIn && styles.buttonPrimaryMuted,
                    pressed && canSignIn && styles.buttonPrimaryPressed,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={() => void handleSignIn()}
                  disabled={loading || !canSignIn}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonPrimaryText}>Sign in</Text>
                  )}
                </Pressable>
              </Animated.View>
            )}
            </View>

            {step === "email" ? (
              <Pressable onPress={() => router.push("/signup")}>
                <Text style={styles.footer}>New here? Create an account</Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  centerWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  roleTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
  },
  roleTab: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.mutedLight,
    paddingBottom: 8,
  },
  roleTabActive: {
    color: colors.black,
    fontWeight: "600",
  },
  roleUnderline: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.black,
  },
  pressedSoft: {
    opacity: 0.65,
  },
  formBlock: {
    width: "100%",
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  title: {
    width: "100%",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.8,
    color: colors.black,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  back: {
    width: "100%",
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.black,
  },
  forgot: {
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    textDecorationLine: "underline",
  },
  error: {
    width: "100%",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 14,
    color: colors.danger,
    lineHeight: 20,
    textAlign: "center",
  },
  buttonPrimary: {
    width: "100%",
    marginTop: spacing.lg,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimaryMuted: {
    backgroundColor: colors.blackSoft,
  },
  buttonPrimaryPressed: {
    backgroundColor: colors.blackPressed,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    letterSpacing: 0.2,
  },
  orRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: 14,
    color: colors.mutedLight,
    fontWeight: "500",
  },
  footer: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    paddingBottom: spacing.xl,
  },
});
