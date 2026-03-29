import { useEffect } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { TextField } from "../components/TextField";
import { useAppStore } from "../store/appStore";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { AppStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "EditIngredient">;

const categories = [
  "Vegetable",
  "Fruit",
  "Protein",
  "Dairy",
  "Pantry",
  "Seasoning",
  "Other",
] as const;

const ingredientSchema = z.object({
  name: z.string().min(1, "Give this ingredient a name."),
  quantity: z.string().min(1, "Add a useful quantity."),
  category: z.enum(categories),
});

type IngredientValues = z.infer<typeof ingredientSchema>;

export function EditIngredientScreen({ route, navigation }: Props) {
  const fridgeItems = useAppStore((state) => state.fridgeItems);
  const pendingScan = useAppStore((state) => state.pendingScan);
  const saveIngredient = useAppStore((state) => state.saveIngredient);
  const updatePendingScanIngredient = useAppStore((state) => state.updatePendingScanIngredient);
  const busy = useAppStore((state) => state.busy.fridge);

  const existingFridgeItem = fridgeItems.find((item) => item.id === route.params.itemId);
  const existingScanItem = pendingScan.find((item) => item.draftId === route.params.draftId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IngredientValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: existingFridgeItem?.name ?? existingScanItem?.name ?? "",
      quantity: existingFridgeItem?.quantity ?? existingScanItem?.quantity ?? "",
      category: (existingFridgeItem?.category ??
        existingScanItem?.category ??
        "Other") as IngredientValues["category"],
    },
  });

  useEffect(() => {
    reset({
      name: existingFridgeItem?.name ?? existingScanItem?.name ?? "",
      quantity: existingFridgeItem?.quantity ?? existingScanItem?.quantity ?? "",
      category: (existingFridgeItem?.category ??
        existingScanItem?.category ??
        "Other") as IngredientValues["category"],
    });
  }, [existingFridgeItem, existingScanItem, reset]);

  const selectedCategory = watch("category");

  const onSubmit = handleSubmit(async (values) => {
    if (route.params.mode === "scan" && route.params.draftId) {
      updatePendingScanIngredient(route.params.draftId, values);
      navigation.goBack();
      return;
    }

    await saveIngredient({
      id: existingFridgeItem?.id,
      name: values.name,
      quantity: values.quantity,
      category: values.category,
      confidence: existingFridgeItem?.confidence ?? 1,
      source: existingFridgeItem?.source ?? "manual",
      createdAt: existingFridgeItem?.createdAt,
    });
    navigation.goBack();
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <ScreenShell
        title={route.params.mode === "scan" ? "Refine scan" : existingFridgeItem ? "Edit item" : "Add ingredient"}
        subtitle={
          route.params.mode === "scan"
            ? "Clean up AI guesses before they become part of your fridge memory."
            : "Keep names and quantities consistent so search and chat stay smart."
        }
      >
        <View style={styles.formCard}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Ingredient name"
                placeholder="Tomato"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                autoCapitalize="words"
                autoFocus={!existingFridgeItem && !existingScanItem}
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Quantity"
                placeholder="2 items"
                value={value}
                onChangeText={onChange}
                error={errors.quantity?.message}
                returnKeyType="done"
              />
            )}
          />

          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setValue("category", category)}
                  style={[
                    styles.categoryChip,
                    category === selectedCategory && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === selectedCategory && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.category?.message ? (
              <Text style={styles.errorText}>{errors.category.message}</Text>
            ) : null}
          </View>

          <PrimaryButton label="Save Ingredient" onPress={onSubmit} loading={busy} />
        </View>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  categorySection: {
    gap: spacing.sm,
  },
  categoryLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  categoryChipText: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.body,
    fontSize: 13,
  },
});
