import { useMemo, useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, clamp } from 'react-native-reanimated';

type ImageLightboxProps = {
  visible: boolean;
  uri?: string;
  alt?: string;
  onClose: () => void;
  placeholder?: string;
};

export function ImageLightbox({ visible, uri, alt, onClose, placeholder }: ImageLightboxProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const source = useMemo(() => {
    if (uri) return { uri };
    if (placeholder) return { uri: placeholder };
    return undefined;
  }, [uri, placeholder]);

  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [visible, scale, translateX, translateY]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = clamp(event.scale, 1, 3);
      scale.value = nextScale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1, { duration: 160 });
      }
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = clamp(translateX.value + event.translationX, -250, 250);
        translateY.value = clamp(translateY.value + event.translationY, -250, 250);
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const target = scale.value > 1 ? 1 : 2;
      scale.value = withTiming(target, { duration: 160 });
      if (target === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.backdrop}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.imageWrapper}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.imageContainer, animatedStyle]}>
                <Image
                  style={styles.image}
                  source={source}
                  contentFit="contain"
                  placeholder={PLACEHOLDER_BLUR_HASH}
                  transition={200}
                  accessible
                  accessibilityLabel={alt || 'Photo'}
                />
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const PLACEHOLDER_BLUR_HASH =
  'LEHLk~WB2yk8pyo0adR*.7kCMdnj'; // Simple blurhash fallback to avoid blank flash

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000dd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000070',
  },
  imageWrapper: {
    width: '100%',
    paddingHorizontal: 16,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
});
