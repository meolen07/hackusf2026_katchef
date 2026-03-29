import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import { ChatRecipeSuggestion } from "../types/contracts";

interface RecipeSuggestionCardProps {
  suggestion: ChatRecipeSuggestion;
  onPress?: () => void;
  variant?: "default" | "wide";
}

export function RecipeSuggestionCard({
  suggestion,
  onPress,
  variant = "default",
}: RecipeSuggestionCardProps) {
  const isWide = variant === "wide";
  const visibleIngredients = suggestion.ingredients.slice(0, isWide ? 3 : 4);
  const remainingIngredientCount = Math.max(suggestion.ingredients.length - visibleIngredients.length, 0);

  return (
    <Animated.View entering={FadeInDown.duration(430)} style={[styles.card, isWide && styles.cardWide]}>
      <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}>
        <View style={styles.metaRow}>
          <Text style={styles.kicker}>Suggested recipe</Text>
          <View style={styles.timePill}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.ink} />
            <Text style={styles.time}>{suggestion.cookTime}</Text>
          </View>
        </View>

        <View style={[styles.contentRow, isWide && styles.contentRowWide]}>
          <View style={styles.contentMain}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{suggestion.title}</Text>
              <Text style={styles.reason} numberOfLines={isWide ? 2 : undefined}>
                {suggestion.reason}
              </Text>
            </View>

            <View style={styles.chips}>
              {visibleIngredients.map((ingredient) => (
                <View key={`${suggestion.title}-${ingredient}`} style={styles.chip}>
                  <Text style={styles.chipText}>{ingredient}</Text>
                </View>
              ))}
              {remainingIngredientCount > 0 ? (
                <View style={styles.chipOverflow}>
                  <Text style={styles.chipOverflowText}>+{remainingIngredientCount} more</Text>
                </View>
              ) : null}
            </View>
          </View>

          {onPress && isWide ? (
            <View style={styles.ctaColumn}>
              <View style={styles.tapHintWide}>
                <Text style={styles.tapHintText}>View recipe</Text>
                <MaterialCommunityIcons name="arrow-right" size={15} color={colors.coralDeep} />
              </View>
            </View>
          ) : null}
        </View>

        {onPress && !isWide ? (
          <View style={styles.footer}>
            <Text style={styles.footerHint}>Tap to open the full recipe</Text>
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>View recipe</Text>
              <MaterialCommunityIcons name="arrow-right" size={15} color={colors.coralDeep} />
            </View>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 4,
    gap: spacing.md,
    ...shadows.soft,
  },
  cardWide: {
    minHeight: 0,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  contentRow: {
    gap: spacing.md,
  },
  contentRowWide: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentMain: {
    flex: 1,
    gap: spacing.sm,
  },
  titleWrap: {
    gap: 6,
  },
  kicker: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 20,
    lineHeight: 25,
    color: colors.ink,
  },
  reason: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.yellowSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  time: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.creamSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    fontSize: 13,
  },
  chipOverflow: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOverflowText: {
    fontFamily: typography.bodyBold,
    color: colors.inkSoft,
    fontSize: 13,
  },
  ctaColumn: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  footer: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  footerHint: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tapHintWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.coralSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tapHintText: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.coralDeep,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
});
