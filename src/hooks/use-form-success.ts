import { useEffect } from "react";
import { toast } from "sonner";

export type FormActionState = { error: string } | { success: true } | null;

/** Fires once when a useActionState result transitions to success.
 * Initial state must be `null` (not `undefined`) so it's distinguishable
 * from a successful action that also returns no error. */
export function useFormSuccessEffect(
  state: FormActionState,
  successMessage: string,
  onSuccess: () => void,
) {
  useEffect(() => {
    if (state && "success" in state) {
      toast.success(successMessage);
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
