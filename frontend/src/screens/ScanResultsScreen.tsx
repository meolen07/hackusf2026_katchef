import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { IngredientCard } from "../components/IngredientCard";
import { KatChefMascot } from "../components/KatChefMascot";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { useAppStore } from "../store/appStore";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { AppStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<AppStackParamList, "ScanResults">;

export function ScanResultsScreen({ navigation }: Props) {
  const pendingScan = useAppStore((state) => state.pendingScan);
  const removePendingScanIngredient = useAppStore((state) => state.removePendingScanIngredient);
  const savePendingScanToFridge = useAppStore((state) => state.savePendingScanToFridge);
  const busy = useAppStore((state) => state.busy.fridge);

  if (pendingScan.length === 0) {
    return (
      <ScreenShell
        title="Nothing to review"
        subtitle="Run another scan and KatChef will line the ingredients up here for a final pass."
      >
        <View style={styles.emptyCard}>
          <KatChefMascot mood="sleepy" tip="No scan items yet. I’ll wake up the second you bring me produce." />
        </View>
        <PrimaryButton label="Back to Scan" onPress={() => navigation.goBack()} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Review your scan"
      subtitle="Tighten up names, quantities, or categories before everything drops into MyFridge."
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>Ready for final check</Text>
        <Text style={styles.summaryTitle}>
          {pendingScan.length} ingredient{pendingScan.length === 1 ? "" : "s"} detected
        </Text>
        <Text style={styles.summaryBody}>
          Keep the strong guesses, edit the weird ones, and drop anything that does not belong.
        </Text>
      </View>

      <KatChefMascot mood="thinking" tip="These guesses are usually solid, but your last edit is the truth that sticks." />

      {pendingScan.map((item) => (
        <IngredientCard
          key={item.draftId}
          item={item}
          onEdit={() =>
            navigation.navigate("EditIngredient", {
              mode: "scan",
              draftId: item.draftId,
            })
          }
          onDelete={() => removePendingScanIngredient(item.draftId)}
        />
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {pendingScan.length} ingredient{pendingScan.length === 1 ? "" : "s"} ready to save.
        </Text>
        <PrimaryButton
          label="Save to MyFridge"
          onPress={async () => {
            await savePendingScanToFridge();
            navigation.goBack();
          }}
          loading={busy}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  summaryEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  summaryTitle: {
    fontFamily: typography.heading,
    fontSize: 22,
    color: colors.ink,
  },
  summaryBody: {
    fontFamily: typography.body,
    color: colors.inkSoft,
    lineHeight: 21,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  footer: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontFamily: typography.body,
    color: colors.muted,
    fontSize: 14,
  },
});
