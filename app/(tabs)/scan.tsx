import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CameraViewfinder } from "@/components/scan/CameraViewfinder";
import { ExtractionSummaryCard } from "@/components/scan/ExtractionSummaryCard";
import { LoadingOverlay } from "@/components/scan/LoadingOverlay";
import { ScanControls } from "@/components/scan/ScanControls";
import { ScanHeader } from "@/components/scan/ScanHeader";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { Colors } from "@/constants/theme";
import { useInvoiceScan } from "@/hooks/scan/useInvoiceScan";

export default function ScanScreen() {
  const router = useRouter();
  const colors = Colors.dark;
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
    action: () => Promise<{ invoiceId: number; imageUri: string } | null>,
    errorTitle: string,
    fallbackMessage: string,
  ) {
    try {
      const result = await action();
      if (result) {
        clearScanPreview();
        router.push(`/invoice/${result.invoiceId}`);
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
      "Import failed",
      "Unable to import invoice.",
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
      "Scan failed",
      "Unable to scan invoice.",
    );
  }

  const needsCamera = Platform.OS !== "web";
  const permissionPending = Boolean(needsCamera && permission === null);
  const cameraBlocked = Boolean(
    needsCamera && permission !== null && !permission.granted,
  );
  const headerTitle = isLoading
    ? "TRANSLATING…"
    : previewData && !error
      ? "DONE"
      : "READY TO SCAN";

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style="light" />
      <View className="flex-1 px-4">
        <ScanHeader
          colors={colors}
          title={headerTitle}
          onClose={() => router.back()}
          onOpenSettings={() => router.push("/settings")}
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
                    ? "Camera access is required to scan invoices."
                    : "Camera access is turned off for this app. Enable it in system settings, then try again."
                }
                retryLabel={
                  permission.canAskAgain ? "Allow camera" : "Open settings"
                }
                variant="dark"
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
              <ExtractionSummaryCard
                colors={colors}
                error={error}
                isLoading={isLoading}
                previewData={previewData}
                previewUri={previewUri}
              />
            </>
          )}
        </View>

        {error && !cameraBlocked ? (
          <View className="mb-3">
            <ErrorState
              message={error}
              retryLabel="Dismiss"
              variant="dark"
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
            clearScanPreview();
          }}
        />
      </View>

      {isLoading ? (
        <LoadingOverlay message="Translating invoice…" variant="dark" />
      ) : null}
    </SafeAreaView>
  );
}
