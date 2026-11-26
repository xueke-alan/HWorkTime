import Button from "antd/es/button";
export default function FolderChange() {
  return (
    <>
      <div className="dialog-head">
        <h2 id="runtimeFolderChangeTitle"></h2>
      </div>
      <div className="dialog-body">
        <div className="folder-change-locations">
          <div className="folder-change-current">
            <svg className="ui-icon" aria-hidden="true">
              <use href="#icon-folder" />
            </svg>
            <div className="folder-change-identity">
              <span
                className="folder-change-label"
                data-current-label=""
              ></span>
              <strong data-current=""></strong>
            </div>
          </div>
          <Button
            data-ui="button"
            htmlType="button"
            data-select=""
            className="hw-button folder-change-picker"
          >
            <span className="folder-change-destination-icon">
              <svg className="ui-icon" aria-hidden="true">
                <use href="#icon-folder" />
              </svg>
            </span>
            <span className="folder-change-identity">
              <span className="folder-change-label" data-target-label=""></span>
              <strong data-target=""></strong>
            </span>
            <span className="folder-change-select-action">
              <span data-select-label=""></span>
              <svg className="ui-icon" aria-hidden="true">
                <use href="#icon-chevron-right" />
              </svg>
            </span>
          </Button>
          <label className="folder-change-migration">
            <span className="folder-change-checkbox">
              <input
                data-ui="input"
                type="checkbox"
                data-migrate=""
                className="hw-check"
              />
              <span className="folder-change-check">
                <svg className="ui-icon" aria-hidden="true">
                  <use href="#icon-check" />
                </svg>
              </span>
            </span>
            <span>
              <span
                className="folder-change-option-title"
                data-migrate-label=""
              ></span>
              <span className="folder-change-help" data-help=""></span>
            </span>
          </label>
        </div>
        <section
          className="folder-change-feedback hidden"
          data-feedback=""
          aria-live="polite"
        >
          <div className="folder-change-feedback-head">
            <p role="status" data-status=""></p>
            <span className="folder-change-percent" data-percent=""></span>
          </div>
          <progress max="1" data-progress=""></progress>
          <p className="folder-change-stats" data-stats=""></p>
          <p className="folder-change-path" data-path=""></p>
        </section>
        <p className="hidden">
          <Button
            data-ui="button"
            htmlType="button"
            data-authorize=""
            className="hw-button ui-button"
          ></Button>
        </p>
      </div>
      <div className="dialog-foot" data-ui="toolbar">
        <Button
          data-ui="button"
          htmlType="button"
          data-close=""
          className="hw-button ui-button"
        ></Button>
        <Button
          data-ui="button"
          htmlType="button"
          data-abort=""
          className="hw-button ui-button"
        ></Button>
        <Button
          data-ui="button"
          htmlType="button"
          data-submit=""
          className="hw-button ui-button primary"
        ></Button>
      </div>
    </>
  );
}
