import { controllerState } from "../controller-state";
type Action = () => void | Promise<void>;
interface Confirmation {
  visible: boolean;
  summary: string;
  busy: boolean;
  confirm?: Action;
  onClose?: Action;
}
interface Restore extends Confirmation {
  error: string;
  corrupt: boolean;
  backupBusy: boolean;
  backup?: Action;
  retry?: Action;
  showRetry: boolean;
}
export const { state: restore, useSnapshot: useRestore } =
  controllerState<Restore>({
    visible: false,
    summary: "",
    busy: false,
    error: "",
    corrupt: false,
    backupBusy: false,
    showRetry: false,
  });
export const { state: removal, useSnapshot: useRemoval } =
  controllerState<Confirmation>({
    visible: false,
    summary: "",
    busy: false,
  });
export const { state: reload, useSnapshot: useReload } = controllerState<{
  confirm: (() => void) | null;
}>({ confirm: null });
export const confirmations = {
  restore,
  removal,
  reload,
  open(id: string) {
    const state =
      id === "restoreDialog"
        ? restore
        : id === "deleteImportDialog"
          ? removal
          : null;
    if (!state) return false;
    state.visible = true;
    return true;
  },
  close(state: Confirmation) {
    if (!state.visible) return;
    state.visible = false;
    state.onClose?.();
  },
};
