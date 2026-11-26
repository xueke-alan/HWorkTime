import Button from "antd/es/button";
export default function StartupPermissions() {
  return (
    <>
      <div className="dialog-head">
        <h2 id="startupPermissionsTitle"></h2>
      </div>
      <div className="dialog-body startup-permissions-grid">
        <section
          id="startupFolderPermission"
          aria-labelledby="runtimeFolderRecoveryTitle"
          hidden
        >
          <h3 id="runtimeFolderRecoveryTitle"></h3>
          <div className="startup-permissions-copy">
            <p data-recovery-status="" role="status"></p>
            <p className="help" id="runtimeFolderRecoveryHelp"></p>
          </div>
          <div className="startup-permissions-actions" data-ui="toolbar">
            <Button
              data-ui="button"
              id="startupFolderAuthorize"
              htmlType="button"
              className="hw-button ui-button primary"
            ></Button>
          </div>
        </section>
        <section
          id="startupClipboardPermission"
          aria-labelledby="clipboardPermissionTitle"
          hidden
        >
          <h3 id="clipboardPermissionTitle"></h3>
          <div className="startup-permissions-copy">
            <p className="help" id="clipboardPermissionHelp"></p>
          </div>
          <div className="startup-permissions-actions" data-ui="toolbar">
            <Button
              data-ui="button"
              id="clipboardPermissionSkip"
              htmlType="button"
              className="hw-button ui-button"
            ></Button>
            <Button
              data-ui="button"
              id="clipboardPermissionAllow"
              htmlType="button"
              className="hw-button ui-button primary"
            ></Button>
          </div>
        </section>
      </div>
    </>
  );
}
