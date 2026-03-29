import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { getLevelProgress } from "../constants/levels";
import { colors, radii, shadows, spacing, typography } from "../theme/tokens";

interface XPProgressCardProps {
  xp: number;
}

export function XPProgressCard({ xp }: XPProgressCardProps) {
  const progressState = getLevelProgress(xp);

  return (
    <Animated.View entering={FadeInDown.duration(430)}>
      <LinearGradient
        colors={[colors.yellowSoft, colors.white]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text style={styles.label}>Chef level</Text>
            <Text style={styles.level}>{progressState.level.title}</Text>
          </View>
          <View style={styles.xpPill}>
            <Text style={styles.xp}>{xp} XP</Text>
          </View>
        </View>

        <View style={styles.track}>
          <LinearGradient
            colors={[colors.coral, colors.coralDeep]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fill, { width: `${Math.max(progressState.progress * 100, 12)}%` }]}
          />
        </View>

        <Text style={styles.caption}>
          {progressState.nextLevel
            ? `${progressState.xpToNext} XP until ${progressState.nextLevel.title}`
            : "You maxed the current ladder. Very suspiciously impressive."}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copy: {
    gap: 2,
  },
  label: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  level: {
    fontFamily: typography.heading,
    fontSize: 24,
    color: colors.ink,
  },
  xp: {
    fontFamily: typography.heading,
    color: colors.coralDeep,
    fontSize: 16,
  },
  xpPill: {
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
  caption: {
    fontFamily: typography.body,
    color: colors.muted,
    fontSize: 14,
  },
});
