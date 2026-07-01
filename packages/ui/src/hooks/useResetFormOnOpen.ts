import { useEffect } from 'react';

export function useResetFormOnOpen<T extends Record<string, unknown>>(
  open: boolean,
  reset: (values: T) => void,
  values: T
) {
  useEffect(() => {
    if (!open) return;
    reset(values);
    // Only reset when the dialog opens — `values`/`reset` intentionally excluded
    // so in-flight prop changes don't clobber form input while the dialog is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
