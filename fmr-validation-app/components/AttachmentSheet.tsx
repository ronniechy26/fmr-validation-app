import { forwardRef, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  BarcodeScanningResult,
  CameraPermissionStatus,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/theme';
import { useThemeColors } from '@/providers/ThemeProvider';
import { AttachmentPayload, AttachmentSubmitResult } from '@/types/forms';
import { SheetBackdrop } from '@/components/SheetBackdrop';

type AttachmentSheetProps = {
  onAttach: (payload: AttachmentPayload) => Promise<AttachmentSubmitResult>;
  initialAbemisId?: string;
};

export const AttachmentSheet = forwardRef<BottomSheetModal, AttachmentSheetProps>(function AttachmentSheet(
  { onAttach, initialAbemisId },
  ref,
) {
  const colors = useThemeColors();
  const snapPoints = useMemo(() => ['45%'], []);
  const [abemisId, setAbemisId] = useState(initialAbemisId ?? '');
  const [qrReference, setQrReference] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus | null>(null);

  useEffect(() => {
    setAbemisId(initialAbemisId ?? '');
  }, [initialAbemisId]);

  const submitAttachment = async (overrides: Partial<AttachmentPayload> = {}) => {
    const payload: AttachmentPayload = {
      abemisId: (overrides.abemisId ?? abemisId).trim() || undefined,
      qrReference: (overrides.qrReference ?? qrReference).trim() || undefined,
    };

    if (!payload.abemisId && !payload.qrReference) {
      setFeedback({ type: 'error', message: 'Enter an ABEMIS ID or scan a QR code to continue.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await onAttach(payload);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Unable to attach draft.' });
        return;
      }
      if (result.message) {
        setFeedback({ type: 'success', message: result.message });
      }
    } catch (error) {
      const message = (error as Error | undefined)?.message || 'Unable to attach draft.';
      setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const requestScanner = async () => {
    const response = await requestPermission();
    if (!response) return;
    setPermissionStatus(response.status);
    if (!response.granted) {
      setFeedback({ type: 'error', message: 'Camera permission is required to scan QR codes.' });
      return;
    }
    setFeedback(null);
    setScannerActive(true);
  };

  const handleScan = ({ data }: BarcodeScanningResult) => {
    if (!scannerActive) return;
    setScannerActive(false);
    setQrReference(data);
    submitAttachment({ qrReference: data });
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={SheetBackdrop}
      onDismiss={() => setScannerActive(false)}
      onChange={(value) => {
        if (value === -1) {
          setScannerActive(false);
        }
      }}
    >
      <BottomSheetView style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
        <View style={[styles.sheetHeaderRow, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Ionicons name="link-outline" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>Attach</Text>
          </View>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Attach to an FMR</Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>Scan a QR or type the ABEMIS ID to link this draft.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>ABEMIS ID</Text>
          <TextInput
            value={abemisId}
            onChangeText={setAbemisId}
            placeholder="e.g. ABEMIS-FMR-002"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>QR Reference</Text>
          <TextInput
            value={qrReference}
            onChangeText={setQrReference}
            placeholder="Scan or type QR code"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          />
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: colors.secondary }]}
            onPress={scannerActive ? () => setScannerActive(false) : requestScanner}
          >
            <Text style={[styles.scanText, { color: colors.primary }]}>
              {scannerActive ? 'Stop scanning' : 'Scan QR now'}
            </Text>
          </TouchableOpacity>
        </View>

        {permissionStatus === 'denied' && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Camera access is blocked. Update permissions in settings or type the QR code manually.
          </Text>
        )}

        {scannerActive && permission?.granted && (
          <View style={[styles.scannerContainer, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417', 'code128'] }}
              onBarcodeScanned={handleScan}
            />
            <View style={styles.scannerOverlay}>
              <Text style={[styles.scannerHint, { color: colors.textPrimary }]}>Aim at the QR code to attach automatically.</Text>
              <TouchableOpacity onPress={() => setScannerActive(false)} style={[styles.cancelScanButton, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cancelScanText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {feedback ? (
          <Text
            style={[
              styles.feedbackText,
              { color: feedback.type === 'error' ? colors.danger : colors.success },
            ]}
          >
            {feedback.message}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.attachButton,
            { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 },
          ]}
          onPress={() => submitAttachment()}
          disabled={submitting}
        >
          <Text style={styles.attachText}>{submitting ? 'Attaching…' : 'Attach Draft'}</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  sheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
  },
  scanButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  scanText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  helperText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  scannerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 240,
    marginTop: spacing.sm,
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  scannerHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  cancelScanButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#00000015',
  },
  cancelScanText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  feedbackText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  attachButton: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  attachText: {
    color: '#fff',
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  sheetHeaderRow: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
