import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";

import { IngredientCard } from "../components/IngredientCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { useAppStore } from "../store/appStore";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { AppStackParamList, AppTabParamList } from "../types/navigation";
import { formatRelativeTime } from "../utils/format";

type Props = BottomTabScreenProps<AppTabParamList, "MyFridge">;

export function MyFridgeScreen({ navigation }: Props) {
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(true);
  const parentNavigation = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1100;
  const isDashboardWide = width >= 900;
  const fridgeItems = useAppStore((state) => state.fridgeItems);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const busyChat = useAppStore((state) => state.busy.chat);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);
  const deleteIngredient = useAppStore((state) => state.deleteIngredient);

  const categories = ["All", ...new Set(fridgeItems.map((item) => item.category))];
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchSuggestions: Array<{
    key: string;
    label: string;
    kind: "ingredient" | "category";
    helper: string;
  }> = [];

  if (normalizedSearch) {
    const seen = new Set<string>();

    for (const item of fridgeItems) {
      const label = item.name.trim();
      const key = `ingredient:${label.toLowerCase()}`;
      if (label.toLowerCase().includes(normalizedSearch) && !seen.has(key)) {
        seen.add(key);
        searchSuggestions.push({
          key,
          label,
          kind: "ingredient",
          helper: item.category,
        });
      }
    }

    for (const category of categories) {
      if (category === "All") continue;
      const key = `category:${category.toLowerCase()}`;
      if (category.toLowerCase().includes(normalizedSearch) && !seen.has(key)) {
        seen.add(key);
        searchSuggestions.push({
          key,
          label: category,
          kind: "category",
          helper: "Filter category",
        });
      }
    }
  }

  const filteredItems = fridgeItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.quantity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleGenerateRecipes() {
    if (fridgeItems.length === 0 || busyChat) return;

    navigation.navigate("Chatbot");
    await sendMessage(
      "Based on everything in my fridge, generate 10-20 recipe ideas. Prioritize realistic meals, quick wins, and smart ways to use what I already have.",
    );
  }

  return (
    <ScreenShell
      title="MyFridge"
    >
      <View style={styles.controlPanel}>
        <View style={[styles.toolbar, isWideLayout && styles.toolbarWide]}>
          <View style={[styles.searchWrap, isWideLayout && styles.searchWrapWide]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={(value) => {
                setSearchQuery(value);
                setShowSearchSuggestions(true);
              }}
              placeholder="Search ingredients"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
              onFocus={() => setShowSearchSuggestions(true)}
              onSubmitEditing={() => setShowSearchSuggestions(false)}
            />
          </View>
          <View style={[styles.toolbarButton, isWideLayout && styles.toolbarButtonWide]}>
            <PrimaryButton
              label="Add ingredient"
              variant="secondary"
              onPress={() => parentNavigation?.navigate("EditIngredient", { mode: "fridge" })}
            />
          </View>
        </View>

        {normalizedSearch && showSearchSuggestions && searchSuggestions.length > 0 ? (
          <View style={styles.suggestionPanel}>
            {searchSuggestions.slice(0, 6).map((suggestion) => (
              <Pressable
                key={suggestion.key}
                onPress={() => {
                  if (suggestion.kind === "category") {
                    setSelectedCategory(suggestion.label);
                    setSearchQuery("");
                  } else {
                    setSelectedCategory("All");
                    setSearchQuery(suggestion.label);
                  }
                  setShowSearchSuggestions(false);
                }}
                style={styles.suggestionRow}
              >
                <View style={styles.suggestionIcon}>
                  <MaterialCommunityIcons
                    name={suggestion.kind === "category" ? "shape-outline" : "food-apple-outline"}
                    size={16}
                    color={colors.coralDeep}
                  />
                </View>
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionLabel}>{suggestion.label}</Text>
                  <Text style={styles.suggestionHelper}>{suggestion.helper}</Text>
                </View>
                <Text style={styles.suggestionType}>
                  {suggestion.kind === "category" ? "Category" : "Ingredient"}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => {
                setSelectedCategory(category);
                setShowSearchSuggestions(false);
              }}
              style={[
                styles.filterChip,
                category === selectedCategory && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  category === selectedCategory && styles.filterTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.overviewRow, isDashboardWide && styles.overviewRowWide]}>
        <View style={styles.generateCard}>
          <View style={styles.generateHeader}>
            <View style={styles.generateIcon}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.coralDeep} />
            </View>
            <View style={styles.generateCopy}>
              <Text style={styles.generateTitle}>Generate recipes</Text>
              <Text style={styles.generateBody}>
                Turn everything in MyFridge into a fuller recipe list without typing the prompt yourself.
              </Text>
            </View>
          </View>
          <PrimaryButton
            label={fridgeItems.length > 0 ? "Generate recipes" : "Add ingredients first"}
            onPress={handleGenerateRecipes}
            loading={busyChat}
            disabled={fridgeItems.length === 0 || busyChat}
          />
        </View>
      </View>

      <Text style={styles.countLabel}>
        {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
      </Text>

      <View style={[styles.itemsGrid, isWideLayout && styles.itemsGridWide]}>
        {filteredItems.map((item) => (
          <View key={item.id} style={[styles.itemSlot, isWideLayout && styles.itemSlotWide]}>
            <IngredientCard
              item={item}
              metaLabel={`Updated ${formatRelativeTime(item.updatedAt)}`}
              onEdit={() => parentNavigation?.navigate("EditIngredient", { mode: "fridge", itemId: item.id })}
              onDelete={() => deleteIngredient(item.id)}
            />
          </View>
        ))}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matches right now</Text>
          <Text style={styles.emptyBody}>
            Try a different search or add an ingredient manually to keep your fridge list current.
          </Text>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  overviewRow: {
    gap: spacing.md,
  },
  overviewRowWide: {
    alignItems: "stretch",
  },
  generateCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...({
      shadowColor: colors.ink,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
    } as const),
  },
  generateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  generateIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.yellowSoft,
  },
  generateCopy: {
    flex: 1,
    gap: 4,
  },
  generateTitle: {
    fontFamily: typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  generateBody: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  controlPanel: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  toolbar: {
    gap: spacing.sm,
  },
  toolbarWide: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    minHeight: 58,
  },
  searchWrapWide: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md + 1,
    fontFamily: typography.body,
    color: colors.ink,
  },
  suggestionPanel: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.coralSoft,
  },
  suggestionCopy: {
    flex: 1,
    gap: 2,
  },
  suggestionLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  suggestionHelper: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  suggestionType: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    color: colors.coralDeep,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  toolbarButton: {
    alignSelf: "flex-start",
  },
  toolbarButtonWide: {
    alignSelf: "stretch",
  },
  filterRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  filterText: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    fontSize: 13,
  },
  filterTextActive: {
    color: colors.white,
  },
  countLabel: {
    fontFamily: typography.body,
    color: colors.muted,
    fontSize: 14,
  },
  itemsGrid: {
    gap: spacing.sm,
  },
  itemsGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  itemSlot: {
    width: "100%",
  },
  itemSlotWide: {
    width: "48.5%",
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
  },
  emptyBody: {
    fontFamily: typography.body,
    lineHeight: 21,
    color: colors.muted,
  },
});
