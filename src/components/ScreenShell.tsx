import { ReactNode, useContext } from "react";
import {
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, radii, spacing, typography } from "../theme/tokens";

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  titleAccessory?: ReactNode;
  children?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
  headerMaxWidth?: number;
}

export function ScreenShell({
  title,
  subtitle,
  titleAccessory,
  children,
  scroll = true,
  contentStyle,
  maxWidth = 1160,
  headerMaxWidth = 620,
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 390;
  const horizontalPadding =
    width < 360 ? spacing.md : width >= 1440 ? 44 : width >= 1200 ? 36 : width >= 900 ? 28 : spacing.lg;
  const bottomPadding = spacing.xxl + insets.bottom + tabBarHeight + spacing.lg;

  const content = (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding, paddingBottom: bottomPadding }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.creamSoft, colors.cream, colors.creamDeep]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.glowOne} />
      <View pointerEvents="none" style={styles.glowTwo} />
      <View pointerEvents="none" style={styles.glowThree} />
      <View pointerEvents="none" style={styles.glowFour} />
      <View pointerEvents="none" style={styles.meshBar} />
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={[styles.inner, { maxWidth }, !scroll && styles.innerFill]}
      >
        <View style={[styles.header, { maxWidth: headerMaxWidth }, isCompactPhone && styles.headerCompact]}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerDot} />
            <Text style={styles.kicker}>KatChef</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isCompactPhone && styles.titleCompact]}>{title}</Text>
            {titleAccessory ? <View style={styles.titleAccessory}>{titleAccessory}</View> : null}
          </View>
          {subtitle ? (
            <Text style={[styles.subtitle, isCompactPhone && styles.subtitleCompact]}>{subtitle}</Text>
          ) : null}
        </View>
        <Animated.View
          entering={FadeInDown.delay(70).duration(520)}
          style={[styles.content, !scroll && styles.contentFill, contentStyle]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  inner: {
    width: "100%",
    alignSelf: "center",
  },
  innerFill: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xl + 4,
    marginTop: spacing.md,
  },
  headerCompact: {
    gap: spacing.xs,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  kickerDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
  },
  kicker: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.inkSoft,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  titleAccessory: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 35,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    maxWidth: 560,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: spacing.xl,
  },
  contentFill: {
    flex: 1,
    minHeight: 0,
  },
  glowOne: {
    position: "absolute",
    top: 10,
    right: -40,
    width: 196,
    height: 196,
    borderRadius: radii.xl * 4,
    backgroundColor: colors.yellowSoft,
    opacity: 0.74,
  },
  glowTwo: {
    position: "absolute",
    top: 240,
    left: -50,
    width: 132,
    height: 132,
    borderRadius: radii.xl * 4,
    backgroundColor: colors.greenSoft,
    opacity: 0.62,
  },
  glowThree: {
    position: "absolute",
    bottom: 110,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: radii.xl * 3,
    backgroundColor: colors.coralSoft,
    opacity: 0.42,
  },
  glowFour: {
    position: "absolute",
    top: 106,
    right: "24%",
    width: 260,
    height: 160,
    borderRadius: radii.xl * 4,
    backgroundColor: "rgba(255,255,255,0.34)",
    opacity: 0.44,
    transform: [{ rotate: "-12deg" }],
  },
  meshBar: {
    position: "absolute",
    top: 74,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(240,227,211,0.7)",
  },
});
