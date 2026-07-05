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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { markWelcomeCompleted } from "@/lib/onboarding";
import { routeAfterSignup } from "@/lib/pin-routing";
import { completeSignup } from "@/lib/signup";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

type Role = "carrier" | "supplier";
type Step = "email" | "name" | "password";

function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.orText}>or</Text>
      <View style={styles.orLine} />
    </View>
  );
}

export default function PremiumSignupScreen() {
  const [role, setRole] = useState<Role>("carrier");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canContinueEmail = email.trim().length > 3 && email.includes("@");
  const canContinueName = fullName.trim().length >= 2;
  const canCreateAccount = password.trim().length >= 6;

  const handleContinueEmail = () => {
    setError(null);
    setSuccess(null);
    if (!canContinueEmail) {
      setError("Enter a valid email address.");
      return;
    }
    setStep("name");
  };

  const handleContinueName = () => {
    setError(null);
    if (!canContinueName) {
      setError("Enter your full name.");
      return;
    }
    setStep("password");
  };

  const handleCreateAccount = async () => {
    setError(null);
    setSuccess(null);

    if (!canCreateAccount) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase keys missing in .env");
      return;
    }

    setLoading(true);
    try {
      const result = await completeSignup({
        email,
        password,
        fullName,
        role,
        referralCode: referralCode || undefined,
      });

      if (result.needsEmailVerification) {
        setSuccess("Account created. Check your email to verify, then log in.");
        return;
      }

      await markWelcomeCompleted();
      await routeAfterSignup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = () => {
    setError("Apple sign up will be available in the next update.");
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
                  <Text style={styles.title}>Create your account</Text>
                  <Text style={styles.subtitle}>Enter your email address</Text>

                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setError(null);
                      setSuccess(null);
                      setEmail(text);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="name@company.com"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.input}
                    returnKeyType="next"
                    onSubmitEditing={handleContinueEmail}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {success ? <Text style={styles.success}>{success}</Text> : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.buttonPrimary,
                      !canContinueEmail && styles.buttonPrimaryMuted,
                      pressed && canContinueEmail && styles.buttonPrimaryPressed,
                    ]}
                    onPress={handleContinueEmail}
                    disabled={!canContinueEmail}
                  >
                    <Text style={styles.buttonPrimaryText}>Continue</Text>
                  </Pressable>

                  <OrDivider />

                  <Pressable
                    style={({ pressed }) => [styles.buttonApple, pressed && styles.buttonApplePressed]}
                    onPress={handleAppleSignUp}
                  >
                    <Ionicons name="logo-apple" size={20} color={colors.black} />
                    <Text style={styles.buttonAppleText}>Sign up with Apple</Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {step === "name" ? (
                <Animated.View
                  key="name-step"
                  entering={FadeInDown.duration(420)}
                  exiting={FadeOut.duration(200)}
                  style={styles.formBlock}
                >
                  <Pressable onPress={() => setStep("email")} hitSlop={8}>
                    <Text style={styles.back}>← {email.trim()}</Text>
                  </Pressable>

                  <Text style={styles.title}>What's your name?</Text>
                  <Text style={styles.subtitle}>Enter your full name</Text>

                  <TextInput
                    value={fullName}
                    onChangeText={(text) => {
                      setError(null);
                      setFullName(text);
                    }}
                    autoCapitalize="words"
                    placeholder="Full name"
                    placeholderTextColor={colors.mutedLight}
                    style={styles.input}
                    returnKeyType="next"
                    onSubmitEditing={handleContinueName}
                    autoFocus
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.buttonPrimary,
                      !canContinueName && styles.buttonPrimaryMuted,
                      pressed && canContinueName && styles.buttonPrimaryPressed,
                    ]}
                    onPress={handleContinueName}
                    disabled={!canContinueName}
                  >
                    <Text style={styles.buttonPrimaryText}>Continue</Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {step === "password" ? (
                <Animated.View
                  key="password-step"
                  entering={FadeInDown.duration(420)}
                  exiting={FadeOut.duration(200)}
                  style={styles.formBlock}
                >
                  <Pressable onPress={() => setStep("name")} hitSlop={8}>
                    <Text style={styles.back}>← {fullName.trim()}</Text>
                  </Pressable>

                  <Text style={styles.title}>Create a password</Text>
                  <Text style={styles.subtitle}>At least 6 characters for your {role} account</Text>

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
                    onSubmitEditing={() => void handleCreateAccount()}
                    autoFocus
                  />

                  <TextInput
                    value={referralCode}
                    onChangeText={setReferralCode}
                    autoCapitalize="characters"
                    placeholder="Referral code (optional)"
                    placeholderTextColor={colors.mutedLight}
                    style={[styles.input, styles.inputSpaced]}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  {success ? <Text style={styles.success}>{success}</Text> : null}

                  <Pressable
                    style={({ pressed }) => [
                      styles.buttonPrimary,
                      !canCreateAccount && styles.buttonPrimaryMuted,
                      pressed && canCreateAccount && styles.buttonPrimaryPressed,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={() => void handleCreateAccount()}
                    disabled={loading || !canCreateAccount}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.buttonPrimaryText}>Create account</Text>
                    )}
                  </Pressable>

                  {success ? (
                    <Pressable style={styles.loginLink} onPress={() => router.replace("/login")}>
                      <Text style={styles.loginLinkText}>Go to login</Text>
                    </Pressable>
                  ) : null}
                </Animated.View>
              ) : null}
            </View>

            {step === "email" ? (
              <Pressable onPress={() => router.push("/login")}>
                <Text style={styles.footer}>Already have an account? Log in</Text>
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
  inputSpaced: {
    marginTop: spacing.sm,
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
  success: {
    width: "100%",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 14,
    color: colors.success,
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
  buttonApple: {
    width: "100%",
    height: 54,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonApplePressed: {
    backgroundColor: colors.inputFill,
    transform: [{ scale: 0.985 }],
  },
  buttonAppleText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
    letterSpacing: 0.1,
  },
  loginLink: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    textDecorationLine: "underline",
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
