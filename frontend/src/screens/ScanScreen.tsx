import { useRef, useState } from "react";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

import { KatChefMascot } from "../components/KatChefMascot";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { detectIngredients } from "../services/api";
import { useAppStore } from "../store/appStore";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { AppTabParamList } from "../types/navigation";
import { SelectedImage } from "../types/contracts";

type Props = BottomTabScreenProps<AppTabParamList, "Scan">;

export function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  const setPendingScan = useAppStore((state) => state.setPendingScan);
  const markScanReward = useAppStore((state) => state.markScanReward);
  const mascotTipIndex = useAppStore((state) => state.mascotTipIndex);
  const cycleMascotTip = useAppStore((state) => state.cycleMascotTip);
  const profile = useAppStore((state) => state.profile);

  async function setImageFromAsset(asset: ImagePicker.ImagePickerAsset) {
    let file: Blob | undefined;

    if (Platform.OS === "web") {
      const fileAsset = (asset as ImagePicker.ImagePickerAsset & { file?: File }).file;
      file = fileAsset;

      if (!file) {
        const response = await fetch(asset.uri);
        file = await response.blob();
      }
    }

    setSelectedImage({
      uri: asset.uri,
      name: asset.fileName || `scan-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
      file,
    });
    setErrorMessage(null);
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    await setImageFromAsset(result.assets[0]);
  }

  async function capturePhoto() {
    if (Platform.OS === "web") {
      await choosePhoto();
      return;
    }

    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        setErrorMessage("Camera access is required for live capture. You can still choose a photo from your library.");
        return;
      }
    }

    const result = await cameraRef.current?.takePictureAsync({
      quality: 0.8,
      base64: false,
    });

    if (!result?.uri) return;
    setSelectedImage({
      uri: result.uri,
      name: `scan-${Date.now()}.jpg`,
      type: "image/jpeg",
    });
    setErrorMessage(null);
  }

  async function handleDetect() {
    if (!selectedImage) return;
    setIsDetecting(true);
    setErrorMessage(null);
    try {
      const response = await detectIngredients(selectedImage);
      if (response.ingredients.length === 0) {
        setErrorMessage(
          "KatLens could not confidently spot ingredients in that photo. Try a clearer image with the food centered and well lit.",
        );
        return;
      }

      setPendingScan(response.ingredients);
      navigation.getParent()?.navigate("ScanResults" as never);
      void markScanReward().catch(() => {
        // XP should never block the review flow after a successful scan.
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Live scan failed.");
    } finally {
      setIsDetecting(false);
    }
  }

  return (
    <ScreenShell
      title="KatLens"
      subtitle="Capture what you bought, let the AI spot ingredients, then clean up the list before it lands in MyFridge."
    >
      <View style={styles.stepRow}>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepLabel}>Capture</Text>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepLabel}>Detect</Text>
        </View>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepLabel}>Review</Text>
        </View>
      </View>

      <View style={styles.helperCard}>
        <View style={styles.helperHeader}>
          <Text style={styles.helperEyebrow}>KatLens guide</Text>
          <Text style={styles.helperTitle}>
            {isDetecting
              ? "Reading the photo"
              : selectedImage
                ? "Photo ready for detection"
                : "Set up a cleaner scan"}
          </Text>
        </View>
        <KatChefMascot
          mood={isDetecting || selectedImage ? "thinking" : "happy"}
          tip={
            isDetecting
              ? "Looking for ingredients, likely categories, and what needs a quick human cleanup after detection."
              : profile?.preferences.mascotTips
                ? ["Scan clean lighting for the sharpest detection.", "Edit names fast before saving so search stays tidy.", "Use scan for produce, then manual add pantry basics."][mascotTipIndex % 3]
                : "Tips are currently tucked away in settings."
          }
          compact
          loading={isDetecting}
          onPress={cycleMascotTip}
        />
      </View>

      {!selectedImage ? (
        <View style={styles.cameraCard}>
          {Platform.OS !== "web" && permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraTitle}>Ready to scan</Text>
              <Text style={styles.cameraBody}>
                {Platform.OS === "web"
                  ? "Web preview uses secure photo upload for reliability. On a phone build, KatChef switches back to live camera capture."
                  : "Allow camera access for live capture, or choose a photo from your library if that is faster."}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.previewCard}>
          <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
          <View style={styles.previewMeta}>
            <Text style={styles.previewMetaLabel}>Photo ready</Text>
            <Text style={styles.previewMetaBody}>Run live detection, then tidy the ingredient list before saving.</Text>
          </View>
        </View>
      )}

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Live scan unavailable</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
        </View>
      ) : null}

      {!selectedImage ? (
        <View style={styles.actions}>
          {Platform.OS !== "web" ? (
            <PrimaryButton
              label={permission?.granted ? "Use Live Camera" : "Allow Camera Access"}
              onPress={capturePhoto}
            />
          ) : null}
          <PrimaryButton
            label={Platform.OS === "web" ? "Choose Photo" : "Choose from Library"}
            variant={Platform.OS === "web" ? "solid" : "secondary"}
            onPress={choosePhoto}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <PrimaryButton
            label="Retake"
            variant="secondary"
            onPress={() => {
              setSelectedImage(null);
              setErrorMessage(null);
            }}
          />
          <PrimaryButton label="Detect Ingredients" onPress={handleDetect} loading={isDetecting} />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  stepCard: {
    flex: 1,
    minWidth: 104,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  stepNumber: {
    fontFamily: typography.heading,
    fontSize: 20,
    color: colors.coral,
  },
  stepLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  helperCard: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  helperHeader: {
    gap: 4,
  },
  helperEyebrow: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  helperTitle: {
    fontFamily: typography.heading,
    fontSize: 21,
    color: colors.ink,
  },
  cameraCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 360,
  },
  camera: {
    width: "100%",
    height: 360,
  },
  cameraFallback: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: "#FFF1E8",
    gap: spacing.sm,
  },
  cameraTitle: {
    fontFamily: typography.heading,
    fontSize: 24,
    color: colors.ink,
  },
  cameraBody: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 420,
  },
  previewCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  previewImage: {
    width: "100%",
    height: 360,
    resizeMode: "cover",
  },
  previewMeta: {
    padding: spacing.md,
    gap: 4,
  },
  previewMetaLabel: {
    fontFamily: typography.bodyBold,
    fontSize: 12,
    color: colors.green,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  previewMetaBody: {
    fontFamily: typography.body,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
  },
  errorCard: {
    backgroundColor: "#FDE2DD",
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.ink,
  },
  errorBody: {
    fontFamily: typography.body,
    color: colors.danger,
    lineHeight: 21,
  },
});
