import { useEffect, useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { TextField } from "../components/TextField";
import { allergyExamples, dietaryPreferenceOptions } from "../constants/appContent";
import { env } from "../lib/env";
import { getBackendHealth } from "../services/api";
import { useAppStore } from "../store/appStore";
import { BackendHealth } from "../types/contracts";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { AppStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

function normalizeList(values: string[]) {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function arraysEqual(left: string[], right: string[]) {
  return JSON.stringify(normalizeList(left)) === JSON.stringify(normalizeList(right));
}

function SettingRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#E5DBCF", true: colors.green }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function PreferenceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.preferenceChip, active && styles.preferenceChipActive]}
    >
      <Text style={[styles.preferenceChipText, active && styles.preferenceChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SettingsScreen(_: Props) {
  const profile = useAppStore((state) => state.profile);
  const togglePreference = useAppStore((state) => state.togglePreference);
  const saveFoodProfile = useAppStore((state) => state.saveFoodProfile);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [savingFoodProfile, setSavingFoodProfile] = useState(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBackendHealth() {
      if (!env.apiBaseUrl) {
        if (!cancelled) {
          setBackendHealth(null);
          setHealthError("Backend URL unresolved");
        }
        return;
      }

      try {
        const nextHealth = await getBackendHealth();
        if (!cancelled) {
          setBackendHealth(nextHealth);
          setHealthError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setBackendHealth(null);
          setHealthError(error instanceof Error ? error.message : "Backend health check failed");
        }
      }
    }

    void loadBackendHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedPreferences(profile?.dietaryPreferences ?? []);
    setAllergyInput((profile?.allergies ?? []).join(", "));
  }, [profile?.dietaryPreferences, profile?.allergies]);

  const parsedAllergies = useMemo(
    () => normalizeList(allergyInput.split(",")),
    [allergyInput],
  );

  const foodProfileChanged = useMemo(() => {
    if (!profile) return false;
    return !arraysEqual(selectedPreferences, profile.dietaryPreferences)
      || !arraysEqual(parsedAllergies, profile.allergies);
  }, [parsedAllergies, profile, selectedPreferences]);

  function toggleDietaryPreference(option: string) {
    setSelectedPreferences((current) =>
      current.includes(option)
        ? current.filter((entry) => entry !== option)
        : [...current, option],
    );
  }

  async function handleSaveFoodProfile() {
    if (!profile) return;
    setSavingFoodProfile(true);
    try {
      await saveFoodProfile({
        dietaryPreferences: normalizeList(selectedPreferences),
        allergies: parsedAllergies,
      });
    } finally {
      setSavingFoodProfile(false);
    }
  }

  return (
    <ScreenShell
      title="Settings"
      subtitle="Tune the vibe without losing the personality. The defaults are playful; the controls are respectful."
    >
      <View style={styles.runtimeHero}>
        <Text style={styles.runtimeHeroEyebrow}>Control center</Text>
        <Text style={styles.runtimeHeroTitle}>A quieter cat, faster scans, cleaner runtime clarity.</Text>
      </View>

      <View style={styles.card}>
        <SettingRow
          title="Mascot tips"
          description="Let KatChef float around with context-aware guidance and tiny pep talks."
          value={profile?.preferences.mascotTips ?? true}
          onChange={() => togglePreference("mascotTips")}
        />
        <SettingRow
          title="Auto-save preference"
          description="Keeps the intent handy if you later want scans to move faster through review."
          value={profile?.preferences.autoSaveScan ?? false}
          onChange={() => togglePreference("autoSaveScan")}
        />
        <SettingRow
          title="Notification placeholder"
          description="Stored in profile now so product messaging can grow into reminders later."
          value={profile?.preferences.notifications ?? true}
          onChange={() => togglePreference("notifications")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Food profile</Text>
        <Text style={styles.helperText}>
          Tell KatChef how you eat so chat suggestions can avoid the wrong ingredients before they ever hit the pan.
        </Text>

        <View style={styles.preferenceSection}>
          <Text style={styles.preferenceTitle}>Dietary preferences</Text>
          <View style={styles.preferenceGrid}>
            {dietaryPreferenceOptions.map((option) => (
              <PreferenceChip
                key={option}
                label={option}
                active={selectedPreferences.includes(option)}
                onPress={() => toggleDietaryPreference(option)}
              />
            ))}
          </View>
        </View>

        <TextField
          label="Allergies or hard avoids"
          placeholder={`Examples: ${allergyExamples.join(", ")}`}
          value={allergyInput}
          onChangeText={setAllergyInput}
          autoCapitalize="words"
        />

        <Text style={styles.helperText}>
          Separate multiple items with commas. KatChef will treat these as ingredients to avoid.
        </Text>

        <PrimaryButton
          label="Save food profile"
          onPress={handleSaveFoodProfile}
          loading={savingFoodProfile}
          disabled={!profile || !foodProfileChanged}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Runtime mode</Text>
        <Text style={styles.runtimeLine}>
          Backend: {env.apiBaseUrl ? env.apiBaseUrl : "Backend URL unresolved"}
        </Text>
        <Text style={styles.runtimeLine}>
          URL strategy: {env.apiBaseUrlResolvedFrom}
        </Text>
        <Text style={styles.runtimeLine}>
          Firebase: {env.firebaseConfigured ? "Configured" : "Missing Firebase web configuration"}
        </Text>
        <Text style={styles.runtimeLine}>
          Google auth: {env.googleAuthAvailable ? "Enabled on this platform" : "Use email or guest on this platform"}
        </Text>
        <Text style={styles.runtimeLine}>
          Scan flow: {env.runtime.isWeb ? "Browser file picker fallback" : "Native camera + library picker"}
        </Text>
        <Text style={styles.runtimeLine}>
          Backend health: {backendHealth ? "Healthy" : healthError ?? "Checking..."}
        </Text>
        {backendHealth ? (
          <Text style={styles.runtimeFootnote}>
            Vision {backendHealth.visionConfigured ? "ready" : "not configured"}, chat {backendHealth.chatbotConfigured ? "ready" : "not configured"}, upload cap {backendHealth.maxUploadSizeMb ?? "?"} MB.
          </Text>
        ) : null}
        <Text style={styles.runtimeFootnote}>
          KatChef is now running in strict live-service mode. Missing credentials will stop features until the real services are connected.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  runtimeHero: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  runtimeHeroEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  runtimeHeroTitle: {
    fontFamily: typography.heading,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 28,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
  },
  settingDescription: {
    fontFamily: typography.body,
    color: colors.muted,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  helperText: {
    fontFamily: typography.body,
    color: colors.muted,
    lineHeight: 20,
  },
  preferenceSection: {
    gap: spacing.sm,
  },
  preferenceTitle: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  preferenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  preferenceChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preferenceChipActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  preferenceChipText: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    fontSize: 13,
  },
  preferenceChipTextActive: {
    color: colors.green,
  },
  runtimeLine: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    lineHeight: 21,
  },
  runtimeFootnote: {
    fontFamily: typography.body,
    color: colors.muted,
    lineHeight: 21,
  },
});
