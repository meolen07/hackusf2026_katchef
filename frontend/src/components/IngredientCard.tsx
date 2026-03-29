import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import { categoryAccent } from "../utils/format";

interface IngredientCardProps {
  item: {
    name: string;
    quantity: string;
    category: string;
    confidence: number;
    updatedAt?: string;
    source?: "manual" | "scan";
  };
  metaLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function IngredientCard({ item, metaLabel, onEdit, onDelete }: IngredientCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.card}>
      <View
        style={[
          styles.accent,
          { backgroundColor: categoryAccent[item.category] ?? categoryAccent.Other },
        ]}
      />
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.quantity}>{item.quantity}</Text>
        </View>
        <View
          style={[
            styles.categoryPill,
            {
              backgroundColor: categoryAccent[item.category] ?? categoryAccent.Other,
            },
          ]}
        >
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {metaLabel ?? `${Math.round(item.confidence * 100)}% confidence`}
        </Text>
        {item.source ? (
          <View style={styles.sourcePill}>
            <Text style={styles.sourceText}>{item.source === "scan" ? "Scanned" : "Manual"}</Text>
          </View>
        ) : null}
      </View>

      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={onEdit} style={styles.actionButton}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.ink} />
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} style={styles.actionButton}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: spacing.sm,
    overflow: "hidden",
    ...shadows.soft,
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
  },
  quantity: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.inkSoft,
  },
  categoryPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
  },
  categoryText: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  sourcePill: {
    borderRadius: radii.pill,
    backgroundColor: colors.creamDeep,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  sourceText: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.creamSoft,
  },
  actionText: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  deleteText: {
    color: colors.danger,
  },
});
