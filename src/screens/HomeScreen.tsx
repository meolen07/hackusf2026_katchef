import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { IngredientCard } from "../components/IngredientCard";
import { KatChefMascot } from "../components/KatChefMascot";
import { RecipeDetailModal } from "../components/RecipeDetailModal";
import { RecipeSuggestionCard } from "../components/RecipeSuggestionCard";
import { ScreenShell } from "../components/ScreenShell";
import { XPProgressCard } from "../components/XPProgressCard";
import { mascotTips } from "../constants/appContent";
import { useAppStore } from "../store/appStore";
import { colors, radii, shadows, spacing, typography } from "../theme/tokens";
import { ChatRecipeSuggestion } from "../types/contracts";
import { AppTabParamList } from "../types/navigation";
import { buildQuickRecipeIdeas } from "../utils/format";
import { useState } from "react";

type Props = BottomTabScreenProps<AppTabParamList, "Home">;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
const fridgeCardAsset = require("../../assets/home-fridge.png");
const homeHeaderAsset = require("../../assets/home-header-chef.png");

const quickActions = [
  {
    label: "Scan ingredients",
    icon: "camera-outline" as IconName,
    route: "Scan" as const,
    description: "Turn a grocery bag into a clean list in one pass.",
  },
  {
    label: "Ask KatChef",
    icon: "chat-outline" as IconName,
    route: "Chatbot" as const,
    description: "Get practical dinner guidance without the ramble.",
  },
];

export function HomeScreen({ navigation }: Props) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ChatRecipeSuggestion | null>(null);
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 1080;
  const isMediumLayout = width >= 760;
  const profile = useAppStore((state) => state.profile);
  const fridgeItems = useAppStore((state) => state.fridgeItems);
  const mascotMood = useAppStore((state) => state.mascotMood);
  const mascotTipIndex = useAppStore((state) => state.mascotTipIndex);
  const cycleMascotTip = useAppStore((state) => state.cycleMascotTip);

  const displayName = profile?.displayName?.split(" ")[0] ?? "Chef";
  const suggestions = buildQuickRecipeIdeas(fridgeItems);

  return (
    <ScreenShell
      title={`Hi, ${displayName}`}
    >
      <View style={styles.heroShell}>
        <View style={[styles.heroSummaryRow, isWideLayout && styles.heroSummaryRowWide]}>
          <View style={styles.heroSummaryContent}>
            <View style={[styles.heroSummaryTop, !isMediumLayout && styles.heroSummaryTopStack]}>
              <View style={styles.heroSummaryCopy}>
                <Text style={styles.heroEyebrow}>Today’s kitchen energy</Text>
                <Text style={styles.heroTitle}>
                  {fridgeItems.length > 0
                    ? `${fridgeItems.length} ingredients ready to become something delicious.`
                    : "Start with one scan and your fridge immediately gets smarter."}
                </Text>
                <Text style={styles.heroBody}>
                  Save a scan, ask for a quick dinner, and keep the app working like a second brain.
                </Text>
              </View>

              <View style={[styles.heroLogoCard, !isMediumLayout && styles.heroLogoCardCompact]}>
                <Image
                  source={homeHeaderAsset}
                  resizeMode="contain"
                  style={[styles.heroLogoImage, !isMediumLayout && styles.heroLogoImageCompact]}
                />
              </View>
            </View>

            <View style={[styles.heroMetrics, isWideLayout && styles.heroMetricsWide]}>
              <View style={[styles.heroMetricCard, styles.heroMetricCardLevel]}>
                <Text style={styles.heroPillLabel}>Level</Text>
                <Text style={styles.heroPillValue}>{profile?.level ?? "Beginner"}</Text>
              </View>
              <View style={styles.heroMetricCard}>
                <Text style={styles.heroMetricValue}>{fridgeItems.length}</Text>
                <Text style={styles.heroMetricLabel}>In fridge</Text>
              </View>
              <View style={styles.heroMetricCard}>
                <Text style={styles.heroMetricValue}>{profile?.scanCount ?? 0}</Text>
                <Text style={styles.heroMetricLabel}>Scans made</Text>
              </View>
              <View style={styles.heroMetricCard}>
                <Text style={styles.heroMetricValue}>{profile?.chatCount ?? 0}</Text>
                <Text style={styles.heroMetricLabel}>Kitchen chats</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <XPProgressCard xp={profile?.xp ?? 0} />

      <Pressable onPress={() => navigation.navigate("MyFridge")}>
        {({ pressed }) => (
          <View
            style={[
              styles.fridgeShowcase,
              isMediumLayout ? styles.fridgeShowcaseWide : styles.fridgeShowcaseStack,
              pressed && styles.fridgeShowcasePressed,
            ]}
          >
            <View style={styles.fridgeInfoCard}>
              <View style={styles.fridgeFeatureKickerRow}>
                <View style={styles.fridgeFeatureBadge}>
                  <Text style={styles.fridgeFeatureBadgeText}>MyFridge</Text>
                </View>
                <View style={styles.fridgeFeatureDot} />
                <Text style={styles.fridgeFeatureEyebrow}>Smart inventory</Text>
              </View>
              <Text style={styles.fridgeFeatureTitle}>Open the fridge and cook from what is already there.</Text>
              <Text style={styles.fridgeFeatureBody}>
                Keep ingredients tidy, spot what you have fast, and turn real inventory into realistic meal ideas.
              </Text>

              <View style={styles.fridgeFeatureMetaRow}>
                <View style={styles.fridgeFeatureStat}>
                  <Text style={styles.fridgeFeatureStatValue}>{fridgeItems.length}</Text>
                  <Text style={styles.fridgeFeatureStatLabel}>items saved</Text>
                </View>
              </View>
            </View>

            <View style={styles.fridgeObjectArea}>
              <View style={styles.fridgeObjectHalo} />
              <View style={styles.fridgeObjectBase} />
              <View style={styles.fridgeObjectCta}>
                <Text style={styles.fridgeObjectCtaText}>Open fridge</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.coralDeep} />
              </View>
              <Image
                source={fridgeCardAsset}
                resizeMode="contain"
                style={[
                  styles.fridgeObjectImage,
                  isWideLayout
                    ? styles.fridgeObjectImageWide
                    : isMediumLayout
                      ? styles.fridgeObjectImageMedium
                      : styles.fridgeObjectImageCompact,
                ]}
              />
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <Pressable
            key={action.route}
            onPress={() => navigation.navigate(action.route)}
            style={[
              styles.quickCard,
              isWideLayout ? styles.quickCardWide : null,
            ]}
          >
            <View style={styles.quickIcon}>
              <MaterialCommunityIcons name={action.icon} size={22} color={colors.coral} />
            </View>
            <View style={styles.quickCopy}>
              <Text style={styles.quickLabel}>{action.label}</Text>
              <Text style={styles.quickDescription}>{action.description}</Text>
            </View>
            <View style={styles.quickArrow}>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.ink} />
            </View>
          </Pressable>
        ))}
      </View>

      <KatChefMascot
        mood={mascotMood}
        tip={profile?.preferences.mascotTips ? mascotTips[mascotTipIndex] : "Mascot tips are snoozed in settings."}
        onPress={cycleMascotTip}
      />

      <View style={[styles.discoveryRow, isWideLayout && styles.discoveryRowWide]}>
        <View
          style={[
            styles.section,
            isWideLayout && styles.discoveryColumn,
            isWideLayout && styles.discoveryColumnPrimary,
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fresh from the fridge</Text>
            <Text style={styles.sectionCaption}>Recently updated ingredients, ready to use.</Text>
          </View>
          {fridgeItems.slice(0, 3).map((item) => (
            <IngredientCard
              key={item.id}
              item={item}
              metaLabel={item.source === "scan" ? "Recently scanned" : "Recently updated"}
            />
          ))}
          {fridgeItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No fridge items yet</Text>
              <Text style={styles.emptyBody}>
                Use KatLens to scan ingredients or add them manually. Either way, dinner gets easier.
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.section,
            isWideLayout && styles.discoveryColumn,
            isWideLayout && styles.discoveryColumnSecondary,
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Smart ideas for tonight</Text>
            <Text style={styles.sectionCaption}>Quick wins generated from what is already on hand.</Text>
          </View>
          <View style={[styles.suggestionGrid, isMediumLayout && styles.suggestionGridWide]}>
            {suggestions.map((suggestion) => (
              <View
                key={suggestion.title}
                style={[styles.suggestionSlot, isMediumLayout && styles.suggestionSlotWide]}
              >
                <RecipeSuggestionCard
                  suggestion={suggestion}
                  onPress={() => setSelectedSuggestion(suggestion)}
                  variant={isWideLayout ? "wide" : "default"}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      <RecipeDetailModal
        suggestion={selectedSuggestion}
        visible={Boolean(selectedSuggestion)}
        onClose={() => setSelectedSuggestion(null)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroShell: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,253,249,0.9)",
    ...shadows.card,
  },
  heroSummaryRow: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroSummaryRowWide: {
    alignItems: "stretch",
  },
  heroSummaryContent: {
    gap: spacing.md,
  },
  heroSummaryTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    position: "relative",
  },
  heroSummaryTopStack: {
    flexDirection: "column",
  },
  heroSummaryCopy: {
    flex: 1,
    gap: spacing.sm,
    maxWidth: 520,
  },
  heroLogoCard: {
    width: 520,
    height: 188,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    right: 0,
    overflow: "hidden",
  },
  heroLogoCardCompact: {
    width: 340,
    height: 140,
    position: "relative",
    top: undefined,
    right: undefined,
    alignSelf: "flex-end",
  },
  heroLogoImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.34 }],
  },
  heroLogoImageCompact: {
    transform: [{ scale: 1.24 }],
  },
  heroEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
  },
  heroBody: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  heroPillLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.coralDeep,
  },
  heroPillValue: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
    marginTop: 4,
  },
  heroMetrics: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  heroMetricsWide: {
    justifyContent: "flex-start",
  },
  heroMetricCard: {
    minWidth: 110,
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  heroMetricCardLevel: {
    minWidth: 180,
  },
  heroMetricValue: {
    fontFamily: typography.heading,
    fontSize: 22,
    color: colors.ink,
  },
  heroMetricLabel: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  fridgeShowcase: {
    gap: spacing.lg,
  },
  fridgeShowcaseWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fridgeShowcaseStack: {
    alignItems: "stretch",
  },
  fridgeShowcasePressed: {
    opacity: 0.97,
    transform: [{ scale: 0.992 }],
  },
  fridgeInfoCard: {
    flex: 1,
    maxWidth: 560,
    backgroundColor: "rgba(255,253,249,0.92)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  fridgeFeatureCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  fridgeFeatureKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  fridgeFeatureBadge: {
    borderRadius: radii.pill,
    backgroundColor: colors.coralSoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
  },
  fridgeFeatureBadgeText: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.coralDeep,
  },
  fridgeFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(123,114,104,0.45)",
  },
  fridgeFeatureEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: colors.inkSoft,
  },
  fridgeFeatureTitle: {
    fontFamily: typography.display,
    fontSize: 25,
    lineHeight: 31,
    color: colors.ink,
    maxWidth: 500,
  },
  fridgeFeatureBody: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    maxWidth: 500,
  },
  fridgeFeatureMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  fridgeFeatureStat: {
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fridgeFeatureStatValue: {
    fontFamily: typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  fridgeFeatureStatLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  fridgeObjectArea: {
    flex: 1,
    minHeight: 340,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fridgeObjectHalo: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: radii.xl * 3,
    backgroundColor: "rgba(255,225,218,0.72)",
  },
  fridgeObjectBase: {
    position: "absolute",
    bottom: 18,
    width: 220,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: "rgba(240,227,211,0.82)",
    transform: [{ scaleX: 1.04 }],
  },
  fridgeObjectCta: {
    position: "absolute",
    bottom: 42,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...shadows.soft,
  },
  fridgeObjectCtaText: {
    fontFamily: typography.bodyBold,
    color: colors.ink,
    fontSize: 13,
  },
  fridgeObjectImage: {
    zIndex: 1,
  },
  fridgeObjectImageCompact: {
    width: 170,
    height: 244,
  },
  fridgeObjectImageMedium: {
    width: 196,
    height: 280,
  },
  fridgeObjectImageWide: {
    width: 228,
    height: 328,
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    flex: 1,
    minWidth: 220,
  },
  quickCardWide: {
    minWidth: 260,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.coralSoft,
  },
  quickCopy: {
    flex: 1,
    gap: 3,
  },
  quickLabel: {
    fontFamily: typography.heading,
    fontSize: 16,
    color: colors.ink,
  },
  quickDescription: {
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  quickArrow: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.creamDeep,
  },
  section: {
    gap: spacing.sm,
    flex: 1,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 20,
    color: colors.ink,
  },
  sectionCaption: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  discoveryRow: {
    gap: spacing.lg,
  },
  discoveryRowWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  discoveryColumn: {
    minWidth: 0,
    flex: 1,
  },
  discoveryColumnPrimary: {
    flex: 0.9,
  },
  discoveryColumnSecondary: {
    flex: 1.1,
  },
  suggestionGrid: {
    gap: spacing.sm,
  },
  suggestionGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suggestionSlot: {
    width: "100%",
  },
  suggestionSlotWide: {
    width: "48.5%",
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.heading,
    color: colors.ink,
    fontSize: 18,
  },
  emptyBody: {
    fontFamily: typography.body,
    color: colors.muted,
    lineHeight: 21,
  },
});
