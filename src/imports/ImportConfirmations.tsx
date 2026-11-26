import Button from "antd/es/button";
import Modal from "antd/es/modal";
import { useLanguage } from "../ApplicationTheme";
import {
  confirmations,
  reload,
  removal,
  restore,
  useReload,
  useRemoval,
  useRestore,
} from "./confirmations";

const reloadButtonProps = {
  size: "large",
  style: { minHeight: 44, minWidth: 88, fontSize: 16 },
} as const;

export default function ImportConfirmations() {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const backup = useRestore(),
    deletion = useRemoval(),
    reloadRequest = useReload();
  return (
    <>
      <Modal
        modalRender={(panel) => <div id="restoreDialog">{panel}</div>}
        open={backup.visible}
        title={t("copy.35a251c943")}
        closable={!backup.busy}
        keyboard={!backup.busy}
        maskClosable={false}
        onCancel={() => confirmations.close(restore)}
        width="min(34rem, calc(100vw - 2rem))"
        footer={
          <>
            <Button
              data-close="restoreDialog"
              disabled={backup.busy}
              onClick={() => confirmations.close(restore)}
            >
              {t("copy.4d0b4688c7")}
            </Button>
            <Button
              type="primary"
              id="confirmRestore"
              disabled={backup.busy}
              onClick={() => backup.confirm?.()}
            >
              {t("copy.a7acce0c26")}
            </Button>
          </>
        }
      >
        <p id="restoreSummary">{backup.summary}</p>
        <p id="restoreError" className="warnings" role="alert">
          {backup.error}
        </p>
        {backup.showRetry && (
          <Button id="retryRestoreTheme" onClick={() => backup.retry?.()}>
            {t("copy.00ecd909a7")}
          </Button>
        )}
        <p className="help dialog-section-spacing">{t("copy.c7cd96dadb")}</p>
        {backup.corrupt && (
          <p id="backupScopeNote" className="help">
            {t("copy.e2cced4b6b")}
          </p>
        )}
        <div className="row restore-backup-actions" data-ui="toolbar">
          <Button
            id="backupBeforeRestore"
            disabled={backup.backupBusy}
            aria-busy={backup.backupBusy}
            onClick={() => backup.backup?.()}
          >
            {t(backup.corrupt ? "copy.4b5a44d0fd" : "copy.02ffd2393f")}
          </Button>
        </div>
      </Modal>
      <Modal
        modalRender={(panel) => <div id="deleteImportDialog">{panel}</div>}
        open={deletion.visible}
        title={t("copy.31fcbd78ba")}
        closable={!deletion.busy}
        keyboard={!deletion.busy}
        maskClosable={false}
        onCancel={() => confirmations.close(removal)}
        width="min(34rem, calc(100vw - 2rem))"
        footer={
          <>
            <Button
              data-close="deleteImportDialog"
              disabled={deletion.busy}
              onClick={() => confirmations.close(removal)}
            >
              {t("copy.4d0b4688c7")}
            </Button>
            <Button
              danger
              id="confirmDeleteImport"
              disabled={deletion.busy}
              onClick={() => deletion.confirm?.()}
            >
              {t("copy.3c06abe116")}
            </Button>
          </>
        }
      >
        <p id="deleteImportSummary">{deletion.summary}</p>
        <p className="help dialog-section-spacing">{t("copy.cdb66f2811")}</p>
      </Modal>
      <Modal
        open={!!reloadRequest.confirm}
        title={t("import.reloadTitle")}
        width="min(36rem, calc(100vw - 2rem))"
        centered
        style={{ top: "max(-5dvh, -48px)" }}
        styles={{
          container: { padding: 24 },
          header: { marginBottom: 12 },
          title: { fontSize: 22, lineHeight: 1.35 },
          body: { fontSize: 16, lineHeight: 1.6 },
          footer: { marginTop: 24 },
        }}
        closable={false}
        mask={{ closable: false }}
        cancelText={t("copy.4d0b4688c7")}
        okText={t("import.reloadConfirm")}
        cancelButtonProps={{ ...reloadButtonProps, autoFocus: true }}
        okButtonProps={reloadButtonProps}
        onCancel={() => {
          reload.confirm = null;
        }}
        onOk={() => reloadRequest.confirm?.()}
      >
        <p>{t("import.reloadDraftWarning")}</p>
      </Modal>
    </>
  );
}
