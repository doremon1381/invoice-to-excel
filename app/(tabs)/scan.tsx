import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { CameraViewfinder } from "@/components/scan/CameraViewfinder";
import { LoadingOverlay } from "@/components/scan/LoadingOverlay";
import { ScanControls } from "@/components/scan/ScanControls";
import { ScanHeader } from "@/components/scan/ScanHeader";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { Colors } from "@/constants/theme";
import { clearPendingScan, setPendingScan } from "@/lib/pendingScan";
import { useInvoiceScan, type ScanResult } from "@/hooks/scan/useInvoiceScan";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const cameraRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    if (permission?.granted || !permission?.canAskAgain) {
      return;
    }

    void requestPermission();
  }, [permission?.canAskAgain, permission?.granted, requestPermission]);

  const {
    captureFromCamera,
    clearScanPreview,
    error,
    isLoading,
    pickFromLibrary,
    previewData,
    previewUri,
    setError,
  } = useInvoiceScan();

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearScanPreview();
        setIsCameraReady(false);
      };
    }, [clearScanPreview]),
  );

  async function handleScanAction(
    action: () => Promise<ScanResult | null>,
    errorTitle: string,
    fallbackMessage: string,
  ) {
    try {
      const result = await action();
      if (result) {
        setPendingScan({
          invoiceName: result.invoiceName,
          extracted: result.extracted,
          imageBase64: result.imageBase64,
          imageMime: result.imageMime,
          imageUri: result.imageUri,
          rawText: result.rawText,
          status: result.status,
        });
        clearScanPreview();
        router.push("/invoice/new");
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : fallbackMessage;
      setError(`${errorTitle}: ${message}`);
    }
  }

  async function handlePickImage() {
    await handleScanAction(
      pickFromLibrary,
      t("scan.importFailed"),
      t("scan.importFailedMessage"),
    );
  }

  async function handleCapture() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* haptics optional */
    }

    if (Platform.OS === "web") {
      await handlePickImage();
      return;
    }

    await handleScanAction(
      () => captureFromCamera(cameraRef),
      t("scan.scanFailed"),
      t("scan.scanFailedMessage"),
    );
  }

  const needsCamera = Platform.OS !== "web";
  const permissionPending = Boolean(needsCamera && permission === null);
  const cameraBlocked = Boolean(
    needsCamera && permission !== null && !permission.granted,
  );
  const headerTitle = isLoading
    ? t("scan.headerTranslating")
    : previewData && !error
      ? t("scan.headerDone")
      : t("scan.headerReady");

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View className="flex-1 px-4">
        <ScanHeader
          colors={colors}
          title={headerTitle}
          onClose={() => router.back()}
          onOpenSettings={() => router.push("/(tabs)/settings")}
        />

        <View className="mt-4 flex-1 items-center justify-center">
          {permissionPending ? (
            <View className="items-center gap-3 py-10">
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : cameraBlocked && permission ? (
            <View className="w-full max-w-[360px] px-2">
              <ErrorState
                message={
                  permission.canAskAgain
                    ? t("scan.cameraRequired")
                    : t("scan.cameraDisabled")
                }
                retryLabel={
                  permission.canAskAgain
                    ? t("scan.allowCamera")
                    : t("scan.openSettings")
                }
                variant="default"
                onRetry={() =>
                  void (permission.canAskAgain
                    ? requestPermission()
                    : Linking.openSettings())
                }
              />
            </View>
          ) : (
            <>
              <CameraViewfinder
                bracketColor={`${colors.accent}CC`}
                cameraRef={cameraRef}
                colors={colors}
                facing="back"
                isCameraReady={isCameraReady}
                staticImageUri={previewUri}
                onCameraReady={() => setIsCameraReady(true)}
              />
              {/* TODO: Add extraction summary card */}
              {/* <ExtractionSummaryCard
                colors={colors}
                error={error}
                isLoading={isLoading}
                previewData={previewData}
                previewUri={previewUri}
              /> */}
            </>
          )}
        </View>

        {error && !cameraBlocked ? (
          <View className="mb-3">
            <ErrorState
              message={error}
              retryLabel={t("scan.dismiss")}
              variant="default"
              onRetry={() => setError(null)}
            />
          </View>
        ) : null}

        <ScanControls
          colors={colors}
          previewUri={previewUri}
          onCapture={() => void handleCapture()}
          onImport={() => void handlePickImage()}
          onRescan={() => {
            clearPendingScan();
            clearScanPreview();
          }}
        />
      </View>

      {isLoading ? (
        <LoadingOverlay message={t("scan.translatingOverlay")} variant="default" />
      ) : null}
    </SafeAreaView>
  );
}
