import { useState } from "react";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { KatChefMascot } from "../components/KatChefMascot";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { XPProgressCard } from "../components/XPProgressCard";
import { BADGE_ORDER, getBadgeDefinition } from "../constants/badges";
import { pickAvatarDataUrl } from "../lib/avatar";
import { useAuthStore } from "../store/authStore";
import { useAppStore } from "../store/appStore";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { AppStackParamList, AppTabParamList } from "../types/navigation";
import { getInitials } from "../utils/format";

type Props = BottomTabScreenProps<AppTabParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const parentNavigation = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
  const profile = useAppStore((state) => state.profile);
  const mascotMood = useAppStore((state) => state.mascotMood);
  const saveAvatar = useAppStore((state) => state.saveAvatar);
  const signOut = useAuthStore((state) => state.signOut);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const unlockedBadges = new Set(profile?.badges ?? []);

  if (!profile) {
    return (
      <ScreenShell
        title="Profile"
        subtitle="Your chef profile comes alive after the first auth session sync."
      >
        <View />
      </ScreenShell>
    );
  }

  async function handleAvatarPick() {
    setAvatarBusy(true);
    setAvatarError(null);

    try {
      const nextAvatar = await pickAvatarDataUrl();
      if (!nextAvatar) {
        return;
      }

      await saveAvatar(nextAvatar);
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "KatChef couldn't update that avatar.",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarBusy(true);
    setAvatarError(null);

    try {
      await saveAvatar(null);
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "KatChef couldn't remove that avatar.",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <ScreenShell
      title="Profile"
    >
      <LinearGradient
        colors={[colors.coral, colors.coralDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatarMediaWrap}>
            <View style={styles.avatar}>
              {profile.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(profile.displayName)}</Text>
              )}
            </View>
            <Pressable
              onPress={handleAvatarPick}
              disabled={avatarBusy}
              style={[styles.avatarCameraButton, avatarBusy && styles.avatarCameraButtonBusy]}
            >
              {avatarBusy ? (
                <ActivityIndicator size="small" color={colors.coralDeep} />
              ) : (
                <MaterialCommunityIcons name="camera" size={18} color={colors.coralDeep} />
              )}
            </Pressable>
          </View>
          {profile.photoURL ? (
            <Pressable
              onPress={handleAvatarRemove}
              disabled={avatarBusy}
              style={[styles.avatarRemoveButton, avatarBusy && styles.avatarRemoveButtonDisabled]}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={13} color="#FFF6F1" />
              <Text style={styles.avatarRemoveText}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{profile.level}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {avatarError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{avatarError}</Text>
        </View>
      ) : null}

      <XPProgressCard xp={profile.xp} />

      <KatChefMascot
        mood={mascotMood}
        tip={`Badges unlocked: ${profile.badges.length}. Tap settings if you want KatChef a little quieter or a little chattier.`}
      />

      <View style={styles.badgeCard}>
        <Text style={styles.sectionTitle}>Badge shelf</Text>
        <View style={styles.badgeWrap}>
          {BADGE_ORDER.map((badge) => {
            const badgeDefinition = getBadgeDefinition(badge);
            const unlocked = unlockedBadges.has(badge);

            if (!badgeDefinition) {
              return (
                <View key={badge} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              );
            }

            return (
              <View
                key={badge}
                style={[styles.badgeMedal, !unlocked && styles.badgeMedalLocked]}
              >
                <Image
                  source={unlocked ? badgeDefinition.unlockedSource : badgeDefinition.lockedSource}
                  style={[styles.badgeMedalImage, !unlocked && styles.badgeMedalImageLocked]}
                />
                <View style={styles.badgeMedalCopy}>
                  <View style={styles.badgeMedalHeader}>
                    <Text style={styles.badgeMedalTitle}>{badgeDefinition.name}</Text>
                    <View
                      style={[
                        styles.badgeStatePill,
                        unlocked ? styles.badgeStatePillUnlocked : styles.badgeStatePillLocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeStateText,
                          unlocked ? styles.badgeStateTextUnlocked : styles.badgeStateTextLocked,
                        ]}
                      >
                        {unlocked ? "Unlocked" : "Locked"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.badgeMedalDescription}>{badgeDefinition.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
        {profile.badges.length === 0 ? (
          <Text style={styles.emptyBadge}>
            First badge lands after your first meaningful kitchen action. The app is rooting for you.
          </Text>
        ) : null}
      </View>

      <View style={styles.badgeCard}>
        <Text style={styles.sectionTitle}>Food profile</Text>
        <View style={styles.profileBlock}>
          <Text style={styles.profileLabel}>Dietary preferences</Text>
          {profile.dietaryPreferences.length > 0 ? (
            <View style={styles.badgeWrap}>
              {profile.dietaryPreferences.map((preference) => (
                <View key={preference} style={styles.preferenceBadge}>
                  <Text style={styles.preferenceBadgeText}>{preference}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyBadge}>No dietary filters saved yet.</Text>
          )}
        </View>

        <View style={styles.profileBlock}>
          <Text style={styles.profileLabel}>Allergies or hard avoids</Text>
          {profile.allergies.length > 0 ? (
            <View style={styles.badgeWrap}>
              {profile.allergies.map((allergy) => (
                <View key={allergy} style={styles.allergyBadge}>
                  <Text style={styles.allergyBadgeText}>{allergy}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyBadge}>No allergies saved yet.</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Open Settings"
          variant="secondary"
          onPress={() => parentNavigation?.navigate("Settings")}
        />
        <PrimaryButton label="Sign Out" onPress={signOut} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexWrap: "wrap",
  },
  avatarWrap: {
    width: 120,
    marginRight: spacing.xs,
    gap: spacing.sm,
    alignItems: "center",
  },
  avatarMediaWrap: {
    position: "relative",
    width: 108,
    height: 108,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: radii.xl * 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.28)",
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  avatarText: {
    fontFamily: typography.display,
    color: colors.white,
    fontSize: 34,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarCameraButton: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: "rgba(229, 86, 65, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  avatarCameraButtonBusy: {
    opacity: 0.9,
  },
  avatarRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(27, 24, 20, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  avatarRemoveText: {
    fontFamily: typography.bodyBold,
    color: "#FFF6F1",
    fontSize: 12,
  },
  avatarRemoveButtonDisabled: {
    opacity: 0.6,
  },
  heroCopy: {
    gap: 6,
    flex: 1,
    minWidth: 240,
  },
  name: {
    fontFamily: typography.heading,
    fontSize: 23,
    color: colors.white,
  },
  email: {
    fontFamily: typography.body,
    color: "#FFF2EC",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  levelBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  levelBadgeText: {
    fontFamily: typography.bodyBold,
    color: colors.yellowSoft,
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: colors.coralSoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(229, 86, 65, 0.14)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: typography.body,
    color: colors.coralDeep,
    lineHeight: 20,
  },
  badgeCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  badgeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  badge: {
    borderRadius: radii.pill,
    backgroundColor: colors.yellowSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  badgeText: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
  },
  badgeMedal: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  badgeMedalLocked: {
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  badgeMedalImage: {
    width: 72,
    height: 72,
  },
  badgeMedalImageLocked: {
    opacity: 0.92,
  },
  badgeMedalCopy: {
    flex: 1,
    gap: 4,
  },
  badgeMedalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  badgeMedalTitle: {
    fontFamily: typography.heading,
    fontSize: 17,
    color: colors.ink,
    flex: 1,
  },
  badgeMedalDescription: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  badgeStatePill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeStatePillUnlocked: {
    backgroundColor: colors.yellowSoft,
  },
  badgeStatePillLocked: {
    backgroundColor: "#ECE8E2",
  },
  badgeStateText: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  badgeStateTextUnlocked: {
    color: colors.ink,
  },
  badgeStateTextLocked: {
    color: colors.muted,
  },
  profileBlock: {
    gap: spacing.sm,
  },
  profileLabel: {
    fontFamily: typography.bodyBold,
    color: colors.inkSoft,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  preferenceBadge: {
    borderRadius: radii.pill,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  preferenceBadgeText: {
    fontFamily: typography.bodyBold,
    color: colors.green,
  },
  allergyBadge: {
    borderRadius: radii.pill,
    backgroundColor: colors.coralSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  allergyBadgeText: {
    fontFamily: typography.bodyBold,
    color: colors.coralDeep,
  },
  emptyBadge: {
    fontFamily: typography.body,
    color: colors.muted,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
