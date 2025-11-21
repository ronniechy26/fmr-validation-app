import { forwardRef, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  BarcodeScanningResult,
  PermissionStatus,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/theme';
import { useThemeColors } from '@/providers/ThemeProvider';
import { AttachmentPayload, AttachmentSubmitResult } from '@/types/forms';
import { SheetBackdrop } from '@/components/SheetBackdrop';
import { LinearGradient } from 'expo-linear-gradient';

type AttachmentSheetProps = {
  onAttach: (payload: AttachmentPayload) => Promise<AttachmentSubmitResult>;
  initialAbemisId?: string;
};

export const AttachmentSheet = forwardRef<BottomSheetModal, AttachmentSheetProps>(function AttachmentSheet(
  { onAttach, initialAbemisId },
  ref,
) {
  const colors = useThemeColors();
  const snapPoints = useMemo(() => ['55%'], []);
  const [abemisId, setAbemisId] = useState(initialAbemisId ?? '');
  const [qrReference, setQrReference] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);

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
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetView style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
        {/* Premium Header */}
        <LinearGradient
          colors={[colors.primary, colors.primary + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerIconContainer}>
            <Ionicons name="link" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>Attach to FMR Project</Text>
            <Text style={styles.sheetSubtitle}>
              Link this draft by scanning a QR code or entering the ABEMIS ID
            </Text>
          </View>
        </LinearGradient>

        {/* ABEMIS ID Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.textPrimary }]}>ABEMIS ID</Text>
          </View>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="key-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={abemisId}
              onChangeText={setAbemisId}
              placeholder="e.g. ABEMIS-FMR-002"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              autoCapitalize="characters"
            />
            {abemisId.length > 0 && (
              <TouchableOpacity onPress={() => setAbemisId('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* QR Reference Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
            <Text style={[styles.label, { color: colors.textPrimary }]}>QR Reference</Text>
          </View>
          <View style={[
            styles.inputContainer,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
              opacity: qrReference ? 1 : 0.7,
            }
          ]}>
            <Ionicons name="barcode-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={qrReference}
              placeholder="Scan QR code to populate"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              editable={false}
            />
            {qrReference.length > 0 && (
              <TouchableOpacity onPress={() => setQrReference('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.scanButton, {
              backgroundColor: scannerActive ? colors.danger : colors.primary,
              borderColor: scannerActive ? colors.danger : colors.primary,
            }]}
            onPress={scannerActive ? () => setScannerActive(false) : requestScanner}
          >
            <Ionicons name={scannerActive ? "stop-circle" : "scan"} size={18} color="#fff" />
            <Text style={styles.scanText}>
              {scannerActive ? 'Stop Scanning' : 'Scan QR Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Permission Denied Message */}
        {permissionStatus === 'denied' && (
          <View style={[styles.warningBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '30' }]}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <Text style={[styles.warningText, { color: colors.danger }]}>
              Camera access blocked. Update permissions in settings or type the QR code manually.
            </Text>
          </View>
        )}

        {/* Scanner View */}
        {scannerActive && permission?.granted && (
          <View style={[styles.scannerContainer, { borderColor: colors.primary, backgroundColor: colors.surfaceMuted }]}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417', 'code128'] }}
              onBarcodeScanned={handleScan}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.scannerOverlay}
            >
              <View style={styles.scannerFrame}>
                <View style={[styles.scannerCorner, styles.scannerCornerTL, { borderColor: colors.primary }]} />
                <View style={[styles.scannerCorner, styles.scannerCornerTR, { borderColor: colors.primary }]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBL, { borderColor: colors.primary }]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBR, { borderColor: colors.primary }]} />
              </View>
              <Text style={styles.scannerHint}>
                <Ionicons name="scan-outline" size={16} color="#fff" /> Aim at the QR code
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Feedback Message */}
        {feedback && (
          <View style={[
            styles.feedbackBanner,
            {
              backgroundColor: feedback.type === 'error' ? colors.danger + '15' : colors.success + '15',
              borderColor: feedback.type === 'error' ? colors.danger + '30' : colors.success + '30',
            }
          ]}>
            <Ionicons
              name={feedback.type === 'error' ? "close-circle" : "checkmark-circle"}
              size={18}
              color={feedback.type === 'error' ? colors.danger : colors.success}
            />
            <Text
              style={[
                styles.feedbackText,
                { color: feedback.type === 'error' ? colors.danger : colors.success },
              ]}
            >
              {feedback.message}
            </Text>
          </View>
        )}

        {/* Attach Button */}
        <TouchableOpacity
          style={[
            styles.attachButton,
            {
              backgroundColor: colors.primary,
              opacity: submitting ? 0.6 : 1,
            },
          ]}
          onPress={() => submitAttachment()}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="#fff" />
              <Text style={styles.attachText}>Attaching…</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.attachText}>Attach Draft</Text>
            </>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  gradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#fff',
  },
  sheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: spacing.xs,
  },
  scanText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: '#fff',
  },
  warningBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  scannerContainer: {
    position: 'relative',
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    marginTop: spacing.xs,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  scannerFrame: {
    width: 150,
    height: 150,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  scannerCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  scannerCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  scannerCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  scannerCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scannerHint: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  feedbackBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  attachText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
