import { shallowReactive } from "vue";
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
export const restore = shallowReactive<Restore>({
  visible: false,
  summary: "",
  busy: false,
  error: "",
  corrupt: false,
  backupBusy: false,
  showRetry: false,
});
export const removal = shallowReactive<Confirmation>({
  visible: false,
  summary: "",
  busy: false,
});
export const confirmations = {
  restore,
  removal,
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
