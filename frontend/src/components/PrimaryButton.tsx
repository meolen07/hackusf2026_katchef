import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radii, shadows, spacing, typography } from "../theme/tokens";

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "solid" | "secondary" | "ghost";
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = "solid",
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === "solid" ? colors.white : colors.coral} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant === "solid" ? styles.solidLabel : styles.secondaryLabel,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable onPress={onPress} disabled={isDisabled}>
      {({ pressed }) =>
        variant === "solid" ? (
          <LinearGradient
            colors={[colors.coral, colors.coralDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              styles.solidButton,
              pressed && !isDisabled && styles.pressed,
              isDisabled && styles.disabled,
            ]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.button,
              variant === "secondary" ? styles.secondaryButton : styles.ghostButton,
              pressed && !isDisabled && styles.pressed,
              isDisabled && styles.disabled,
            ]}
          >
            {content}
          </View>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.lg,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    overflow: "hidden",
  },
  solidButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: colors.coral,
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  ghostButton: {
    backgroundColor: "rgba(255,255,255,0.42)",
    borderWidth: 1,
    borderColor: "rgba(240,227,211,0.8)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.heading,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  solidLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.988 }, { translateY: 1 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
