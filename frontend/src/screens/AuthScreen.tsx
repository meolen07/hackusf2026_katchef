import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { z } from "zod";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { TextField } from "../components/TextField";
import { googleSignInEnabled, googleSignInMessage } from "../lib/auth";
import { useAuthStore } from "../store/authStore";
import { colors, radii, spacing, typography } from "../theme/tokens";

type AuthMode = "login" | "signup" | "forgot";

interface AuthFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const loginSchema = z.object({
  email: z.string().email("Use a real email so future-you can log in."),
  password: z.string().min(6, "Password needs at least 6 characters."),
});

const signupSchema = z
  .object({
    displayName: z.string().min(2, "Add the name KatChef should call you."),
    email: z.string().email("Use a real email so future-you can log in."),
    password: z.string().min(6, "Password needs at least 6 characters."),
    confirmPassword: z.string().min(6, "Confirm your password here too."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords should match. Tiny but important detail.",
  });

const forgotSchema = z.object({
  email: z.string().email("Use the email tied to your account."),
});

const modeCopy: Record<AuthMode, { title: string; subtitle: string; button: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Pick up where your fridge left off.",
    button: "Log In",
  },
  signup: {
    title: "Create account",
    subtitle: "Start turning shelf chaos into actual meals.",
    button: "Create Account",
  },
  forgot: {
    title: "Reset password",
    subtitle: "We’ll send the rescue link. No kitchen panic necessary.",
    button: "Send Reset Link",
  },
};

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1080;
  const authError = useAuthStore((state) => state.error);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signInAsGuest = useAuthStore((state) => state.signInAsGuest);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const sendReset = useAuthStore((state) => state.sendReset);
  const clearError = useAuthStore((state) => state.clearError);

  const schema = mode === "signup" ? signupSchema : mode === "forgot" ? forgotSchema : loginSchema;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const copy = modeCopy[mode];
  const isSuccessMessage = Boolean(authError?.toLowerCase().includes("sent"));

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof AuthFormValues | undefined;
        if (field) {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    if (mode === "signup") {
      await signUp(values.email, values.password, values.displayName);
      return;
    }

    if (mode === "forgot") {
      await sendReset(values.email);
      return;
    }

    await signIn(values.email, values.password);
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenShell
        title="KatChef"
        subtitle="A kitchen co-pilot with sharp instincts, a soft landing, and a cat’s opinion about your leftovers."
      >
        <View style={[styles.authLayout, isWideLayout && styles.authLayoutWide]}>
          <View style={[styles.formCard, isWideLayout && styles.formCardWide]}>
            <View style={styles.modeRail}>
              {(["login", "signup", "forgot"] as AuthMode[]).map((entry) => {
                const label = entry === "forgot" ? "Forgot" : entry === "signup" ? "Sign up" : "Log in";
                return (
                  <Pressable
                    key={entry}
                    onPress={() => {
                      clearError();
                      setMode(entry);
                    }}
                    style={[
                      styles.modeChip,
                      entry === mode ? styles.modeChipActive : styles.modeChipInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        entry === mode ? styles.modeChipTextActive : styles.modeChipTextInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.formEyebrow}>Your kitchen account</Text>
              <Text style={styles.formTitle}>{copy.title}</Text>
              <Text style={styles.formSubtitle}>{copy.subtitle}</Text>
            </View>

            {mode === "signup" ? (
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Display name"
                    placeholder="Chef Lina"
                    value={value}
                    onChangeText={onChange}
                    error={errors.displayName?.message}
                    autoCapitalize="words"
                  />
                )}
              />
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Email"
                  placeholder="you@katchef.app"
                  value={value}
                  onChangeText={onChange}
                  error={errors.email?.message}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />

            {mode !== "forgot" ? (
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Password"
                    placeholder="At least 6 characters"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    secureTextEntry
                  />
                )}
              />
            ) : null}

            {mode === "signup" ? (
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <TextField
                    label="Confirm password"
                    placeholder="One more time"
                    value={value}
                    onChangeText={onChange}
                    error={errors.confirmPassword?.message}
                    secureTextEntry
                  />
                )}
              />
            ) : null}

            {authError ? (
              <View
                style={[
                  styles.notice,
                  isSuccessMessage ? styles.successNotice : styles.errorNotice,
                ]}
              >
                <Text
                  style={[
                    styles.noticeText,
                    isSuccessMessage ? styles.successText : styles.errorText,
                  ]}
                >
                  {authError}
                </Text>
              </View>
            ) : null}

            <View style={styles.buttonStack}>
              <PrimaryButton
                label={copy.button}
                onPress={onSubmit}
                loading={isSubmitting}
              />

              {mode !== "forgot" ? (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or keep it fast</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  {googleSignInEnabled ? (
                    <PrimaryButton
                      label="Continue with Google"
                      variant="secondary"
                      onPress={signInWithGoogle}
                    />
                  ) : (
                    <View style={styles.capabilityNotice}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={18}
                        color={colors.muted}
                      />
                      <Text style={styles.capabilityNoticeText}>{googleSignInMessage}</Text>
                    </View>
                  )}
                  <PrimaryButton
                    label="Continue as Guest"
                    variant="ghost"
                    onPress={signInAsGuest}
                  />
                </>
              ) : null}
            </View>
          </View>
        </View>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  authLayout: {
    gap: spacing.lg,
  },
  authLayoutWide: {
    justifyContent: "center",
  },
  modeRail: {
    flexDirection: "row",
    gap: spacing.xs,
    padding: 6,
    borderRadius: radii.xl,
    backgroundColor: "rgba(255,255,255,0.54)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  modeChipActive: {
    backgroundColor: colors.coral,
    shadowColor: colors.coral,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  modeChipInactive: {
    backgroundColor: "transparent",
  },
  modeChipText: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
  },
  modeChipTextActive: {
    color: colors.white,
  },
  modeChipTextInactive: {
    color: colors.ink,
  },
  formCard: {
    backgroundColor: "rgba(255,253,249,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg + 2,
    gap: spacing.md,
    ...({
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    } as const),
  },
  formCardWide: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  formHeader: {
    gap: 5,
  },
  formEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  formTitle: {
    fontFamily: typography.heading,
    fontSize: 26,
    color: colors.ink,
  },
  formSubtitle: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  notice: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorNotice: {
    backgroundColor: "#FDE2DD",
  },
  successNotice: {
    backgroundColor: colors.greenSoft,
  },
  noticeText: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
  },
  successText: {
    color: colors.green,
  },
  buttonStack: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: typography.body,
    color: colors.muted,
    fontSize: 13,
  },
  capabilityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.68)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  capabilityNoticeText: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
});
