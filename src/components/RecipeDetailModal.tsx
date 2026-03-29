import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, spacing, typography } from "../theme/tokens";
import { ChatRecipeSuggestion } from "../types/contracts";
import { getRecipeSteps } from "../utils/format";

interface RecipeDetailModalProps {
  suggestion: ChatRecipeSuggestion | null;
  visible: boolean;
  onClose: () => void;
}

export function RecipeDetailModal({ suggestion, visible, onClose }: RecipeDetailModalProps) {
  const insets = useSafeAreaInsets();

  if (!suggestion) {
    return null;
  }

  const steps = getRecipeSteps(suggestion);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>Full recipe</Text>
              <Text style={styles.title}>{suggestion.title}</Text>
              <Text style={styles.reason}>{suggestion.reason}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.coralDeep} />
                <Text style={styles.metaText}>{suggestion.cookTime}</Text>
              </View>
              <View style={styles.metaPill}>
                <MaterialCommunityIcons name="format-list-bulleted" size={16} color={colors.coralDeep} />
                <Text style={styles.metaText}>{steps.length} steps</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.ingredientsWrap}>
                {suggestion.ingredients.map((ingredient) => (
                  <View key={`${suggestion.title}-${ingredient}`} style={styles.ingredientChip}>
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Step by step</Text>
              <View style={styles.stepList}>
                {steps.map((step, index) => (
                  <View key={`${suggestion.title}-step-${index + 1}`} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(46, 41, 36, 0.2)",
  },
  sheet: {
    maxHeight: "86%",
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.green,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 26,
    color: colors.ink,
  },
  reason: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.yellowSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  metaText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
  },
  ingredientsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  ingredientChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.creamSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  ingredientText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  stepList: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  stepText: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
});
