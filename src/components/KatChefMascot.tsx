import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import { MascotMood } from "../types/contracts";

interface KatChefMascotProps {
  mood: MascotMood;
  tip?: string;
  compact?: boolean;
  loading?: boolean;
  onPress?: () => void;
}

const mascotImage = require("../../assets/katchef-mascot.png");

const moodMap: Record<MascotMood, { accent: string; label: string }> = {
  happy: { accent: colors.coral, label: "ready to help" },
  thinking: { accent: colors.yellow, label: "plotting dinner" },
  celebrating: { accent: colors.green, label: "tiny victory dance" },
  sleepy: { accent: colors.yellowSoft, label: "waiting for a snack mission" },
  curious: { accent: colors.greenSoft, label: "found something interesting" },
};

export function KatChefMascot({
  mood,
  tip,
  compact = false,
  loading = false,
  onPress,
}: KatChefMascotProps) {
  const bob = useSharedValue(0);
  const dotOne = useSharedValue(0.45);
  const dotTwo = useSharedValue(0.45);
  const dotThree = useSharedValue(0.45);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(withTiming(-7, { duration: 1800 }), withTiming(7, { duration: 1800 })),
      -1,
      true,
    );
  }, [bob]);

  useEffect(() => {
    if (!loading) {
      dotOne.value = 0.45;
      dotTwo.value = 0.45;
      dotThree.value = 0.45;
      return;
    }

    dotOne.value = withRepeat(withSequence(withTiming(1, { duration: 280 }), withTiming(0.45, { duration: 280 })), -1, false);
    dotTwo.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 120 }),
        withTiming(1, { duration: 280 }),
        withTiming(0.45, { duration: 280 }),
      ),
      -1,
      false,
    );
    dotThree.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 240 }),
        withTiming(1, { duration: 280 }),
        withTiming(0.45, { duration: 280 }),
      ),
      -1,
      false,
    );
  }, [dotOne, dotTwo, dotThree, loading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));
  const dotOneStyle = useAnimatedStyle(() => ({ opacity: dotOne.value, transform: [{ scale: 0.92 + dotOne.value * 0.14 }] }));
  const dotTwoStyle = useAnimatedStyle(() => ({ opacity: dotTwo.value, transform: [{ scale: 0.92 + dotTwo.value * 0.14 }] }));
  const dotThreeStyle = useAnimatedStyle(() => ({ opacity: dotThree.value, transform: [{ scale: 0.92 + dotThree.value * 0.14 }] }));

  const mascot = moodMap[mood];

  return (
    <Animated.View entering={FadeInDown.duration(460)} style={[animatedStyle, compact ? styles.compactWrap : styles.wrap]}>
      <Pressable onPress={onPress} style={[styles.shell, compact && styles.compactShell]}>
        <View style={[styles.mascotStage, compact && styles.compactStage]}>
          <View
            style={[
              styles.mascotGlow,
              compact && styles.compactMascotGlow,
              { backgroundColor: mascot.accent },
            ]}
          />
          {loading ? <View style={[styles.loadingHalo, compact && styles.compactLoadingHalo]} /> : null}
          <Image
            source={mascotImage}
            resizeMode="contain"
            style={[styles.mascotImage, compact && styles.compactMascotImage]}
          />
        </View>
        <View style={[styles.bubble, compact && styles.compactBubble, loading && styles.loadingBubble]}>
          <Text style={styles.state}>{mascot.label}</Text>
          {tip ? <Text style={styles.tip}>{tip}</Text> : null}
          {loading ? (
            <View style={styles.loadingRow}>
              <Text style={styles.loadingLabel}>Building recipe list</Text>
              <View style={styles.loadingDots}>
                <Animated.View style={[styles.loadingDot, dotOneStyle]} />
                <Animated.View style={[styles.loadingDot, dotTwoStyle]} />
                <Animated.View style={[styles.loadingDot, dotThreeStyle]} />
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
  },
  compactWrap: {
    alignSelf: "center",
  },
  shell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  compactShell: {
    gap: spacing.sm,
  },
  mascotStage: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  compactStage: {
    width: 104,
    height: 104,
  },
  mascotGlow: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: radii.xl * 3,
    opacity: 0.22,
    transform: [{ scale: 1.15 }],
  },
  compactMascotGlow: {
    width: 76,
    height: 76,
  },
  mascotImage: {
    width: 112,
    height: 112,
    ...shadows.float,
  },
  compactMascotImage: {
    width: 100,
    height: 100,
  },
  loadingHalo: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: radii.xl * 3,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.68)",
  },
  compactLoadingHalo: {
    width: 88,
    height: 88,
  },
  bubble: {
    maxWidth: 240,
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  compactBubble: {
    maxWidth: 220,
  },
  loadingBubble: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  state: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  tip: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
  loadingRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  loadingLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.coralDeep,
  },
  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
  },
});
