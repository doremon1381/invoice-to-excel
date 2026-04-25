import { CameraView, type CameraType } from 'expo-camera';
import { Image, Platform, View } from 'react-native';
import type { RefObject } from 'react';

import { ThemedText } from '@/components/shared/themed-text';
import type { Colors } from '@/constants/theme';

const BRACKET_LEN = 28;
const BRACKET_THICK = 3;

function CornerBracket({ color, position }: { color: string; position: 'bl' | 'br' | 'tl' | 'tr' }) {
  const base = {
    position: 'absolute' as const,
    width: BRACKET_LEN,
    height: BRACKET_LEN,
    borderColor: color,
  };

  switch (position) {
    case 'tl':
      return (
        <View
          pointerEvents="none"
          style={{
            ...base,
            borderLeftWidth: BRACKET_THICK,
            borderTopLeftRadius: 4,
            borderTopWidth: BRACKET_THICK,
            left: 0,
            top: 0,
          }}
        />
      );
    case 'tr':
      return (
        <View
          pointerEvents="none"
          style={{
            ...base,
            borderRightWidth: BRACKET_THICK,
            borderTopRightRadius: 4,
            borderTopWidth: BRACKET_THICK,
            right: 0,
            top: 0,
          }}
        />
      );
    case 'bl':
      return (
        <View
          pointerEvents="none"
          style={{
            ...base,
            borderBottomLeftRadius: 4,
            borderBottomWidth: BRACKET_THICK,
            borderLeftWidth: BRACKET_THICK,
            bottom: 0,
            left: 0,
          }}
        />
      );
    case 'br':
      return (
        <View
          pointerEvents="none"
          style={{
            ...base,
            borderBottomRightRadius: 4,
            borderBottomWidth: BRACKET_THICK,
            borderRightWidth: BRACKET_THICK,
            bottom: 0,
            right: 0,
          }}
        />
      );
  }
}

type CameraViewfinderProps = {
  bracketColor: string;
  cameraRef: RefObject<InstanceType<typeof CameraView> | null>;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  facing: CameraType;
  isCameraReady: boolean;
  onCameraReady: () => void;
  staticImageUri?: string | null;
};

export function CameraViewfinder({
  bracketColor,
  cameraRef,
  colors,
  facing,
  isCameraReady,
  onCameraReady,
  staticImageUri,
}: CameraViewfinderProps) {
  const showLiveCamera = Platform.OS !== 'web' && !staticImageUri;

  return (
    <View
      className="w-full overflow-hidden rounded-[30px] border"
      style={{
        aspectRatio: 3 / 4,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        maxHeight: '85%',
      }}>
      {showLiveCamera ? (
        <CameraView ref={cameraRef} facing={facing} style={{ flex: 1 }} onCameraReady={onCameraReady} />
      ) : staticImageUri ? (
        <Image resizeMode="cover" source={{ uri: staticImageUri }} style={{ flex: 1 }} />
      ) : (
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.surface }}>
          <ThemedText
            className="text-center text-sm"
            scaleRole="chrome"
            style={{ color: colors.muted }}
            type="custom"
          >
            {Platform.OS === 'web'
              ? 'Live camera is not available in the browser. Use Import to choose an image.'
              : 'Camera preview unavailable.'}
          </ThemedText>
        </View>
      )}

      <CornerBracket color={bracketColor} position="tl" />
      <CornerBracket color={bracketColor} position="tr" />
      <CornerBracket color={bracketColor} position="bl" />
      <CornerBracket color={bracketColor} position="br" />

      {!isCameraReady && showLiveCamera ? (
        <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: `${colors.background}99` }} />
      ) : null}
    </View>
  );
}
