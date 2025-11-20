import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

export function SheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
      {...props}
    />
  );
}
