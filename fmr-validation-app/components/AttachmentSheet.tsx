import { forwardRef, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { fonts, spacing } from '@/theme';
import { useThemeColors } from '@/providers/ThemeProvider';
import { AttachmentPayload } from '@/types/forms';
import { SheetBackdrop } from '@/components/SheetBackdrop';

type AttachmentSheetProps = {
  onAttach: (payload: AttachmentPayload) => void;
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

  const handleAttach = () => {
    if (!abemisId.trim() && !qrReference.trim()) {
      return;
    }
    onAttach({
      abemisId: abemisId.trim() || undefined,
      qrReference: qrReference.trim() || undefined,
    });
  };

  const simulateQr = () => {
    setQrReference('QR-FMR-001');
    onAttach({ qrReference: 'QR-FMR-001' });
  };

  return (
    <BottomSheetModal ref={ref} index={0} snapPoints={snapPoints} backdropComponent={SheetBackdrop}>
      <BottomSheetView style={[styles.sheetContent, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Attach to existing FMR</Text>
        <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>Use a QR scan or ABEMIS ID.</Text>

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
          <TouchableOpacity style={[styles.simulateButton, { backgroundColor: colors.secondary }]} onPress={simulateQr}>
            <Text style={[styles.simulateText, { color: colors.primary }]}>Simulate QR Scan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.attachButton, { backgroundColor: colors.primary }]} onPress={handleAttach}>
          <Text style={styles.attachText}>Attach Draft</Text>
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
  simulateButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  simulateText: {
    fontFamily: fonts.semibold,
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
});
