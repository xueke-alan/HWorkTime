import Alert from "antd/es/alert";
import Button from "antd/es/button";
import ConfigProvider from "antd/es/config-provider";
import Compact, { type SpaceCompactRef } from "antd/es/space/Compact";
import { useEffect, useRef, useState } from "react";
import { ArrowCircleUpRightIcon } from "../phosphor-icons";
import { oaActions, useOAActions } from "./views";
import { useLanguage } from "../ApplicationTheme";
import { ImportRows, ImportHistory } from "../imports/ImportRecords";
import "../styles/summary-sidebar.css";
export default function SummarySidebar() {
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  const { back, yearMode, clipboardNotice } = useOAActions();
  const [headerBack, setHeaderBack] = useState(back);
  const header = useRef<SpaceCompactRef>(null);
  // Keep the outgoing button intact while it fades into the year/month label.
  if (!yearMode && headerBack !== back) setHeaderBack(back);
  useEffect(() => {
    if (!yearMode || headerBack === back) return;
    let cancelled = false;
    // Read after the calendar controller has applied the header's CSS transition.
    const frame = requestAnimationFrame(() => {
      const animations = header.current?.nativeElement.getAnimations() || [];
      void Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        if (!cancelled) setHeaderBack(back);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [back, yearMode, headerBack]);
  const pasteInput = useRef<HTMLTextAreaElement>(null);
  const pasteHint = t("copy.4c7c6082dd");
  return (
    <>
      <aside
        className="panel summary-sidebar"
        aria-label="工时概览"
        data-i18n-aria-label="copy.6bcc55abab"
        data-ui="panel"
      >
        <div className="oa-entry sidebar-actions">
          <Compact
            ref={header}
            id="oaRecordActions"
            className={headerBack ? "is-return" : undefined}
            role="group"
            aria-label={t("copy.8e91ca9989")}
          >
            <Button
              size="large"
              id="importOpen"
              color="primary"
              variant="outlined"
            >
              {headerBack || t("copy.ed282645c7")}
            </Button>
            <ConfigProvider wave={{ disabled: true }}>
              <Button
                size="large"
                id="importOASite"
                color="primary"
                variant="filled"
                inert={!!headerBack}
                aria-label={t("copy.bba6f511e6")}
                icon={<ArrowCircleUpRightIcon aria-hidden="true" />}
              />
            </ConfigProvider>
          </Compact>
          <span className="sidebar-year-month" aria-hidden="true">
            <span
              id="sidebarYearMonthText"
              className="sidebar-year-month-text year-month-label"
              role="img"
            >
              <span
                className="sidebar-year-number year-month-year"
                aria-hidden="true"
              />
              <svg
                className="calendar-date-divider"
                viewBox="0 0 12 24"
                aria-hidden="true"
                focusable="false"
              >
                <use href="#icon-calendar-date-divider" />
              </svg>
              <span
                className="sidebar-month-number year-month-month"
                aria-hidden="true"
              />
            </span>
          </span>
        </div>
        <section
          id="cards"
          className="cards"
          aria-label="工时汇总"
          tabIndex={0}
          data-i18n-aria-label="copy.370463779d"
        />
        <div className="sidebar-oa-workspace" hidden>
          <dialog
            id="importDialog"
            aria-label="导入 OA 记录"
            className="sidebar-oa-pane"
            aria-modal="false"
            data-i18n-aria-label="copy.8e91ca9989"
            data-ui="dialog"
          >
            <div className="dialog-body">
              <div className="import-input-grid hw-field">
                <textarea
                  ref={pasteInput}
                  id="pasteText"
                  rows={6}
                  aria-label={pasteHint}
                  placeholder={pasteHint}
                  data-i18n-aria-label="copy.4c7c6082dd"
                  data-i18n-placeholder="copy.4c7c6082dd"
                  className="hw-field"
                ></textarea>
                {clipboardNotice && (
                  <Alert
                    id="importClipboardNotice"
                    className="import-clipboard-notice"
                    type="info"
                    title={t("import.clipboardAutofilled")}
                    closable={{
                      "aria-label": t("copy.6c14bd7f6f"),
                      onClose: () => {
                        oaActions.clipboardNotice = false;
                        pasteInput.current?.focus({ preventScroll: true });
                      },
                    }}
                  />
                )}
              </div>
              <div className="row dialog-section-spacing">
                <span
                  id="importSummary"
                  className="muted import-caption"
                  role="status"
                >
                  暂无解析
                </span>
              </div>
            </div>
            <div data-ui="toolbar" className="dialog-foot import-dialog-foot">
              <div className="import-footer-links">
                <Button
                  id="oaShortcut"
                  htmlType="button"
                  data-hint-text="考勤系统"
                  aria-label="考勤系统，点击打开，按住两秒编辑链接"
                  data-i18n-hint-text="copy.17ee70762b"
                  data-i18n-aria-label="copy.a6ba7e0e2c"
                  className="hw-button ui-button"
                >
                  <span className="oa-icon-slot" aria-hidden="true">
                    <svg className="ui-icon oa-link-icon">
                      <use href="#icon-open-in-new" />
                    </svg>
                    <svg
                      className="oa-hold-icon"
                      viewBox="0 0 32 32"
                      aria-hidden="true"
                    >
                      <circle className="hold-track" cx="16" cy="16" r="13" />
                      <circle
                        className="hold-progress"
                        cx="16"
                        cy="16"
                        r="13"
                        pathLength="100"
                      />
                      <use
                        className="oa-paperclip"
                        href="#icon-attach-file"
                        x="6"
                        y="6"
                        width="20"
                        height="20"
                        fill="currentColor"
                        stroke="none"
                      />
                    </svg>
                  </span>
                  <span
                    className="button-label"
                    data-i18n-text='{"0":"copy.17ee70762b"}'
                  >
                    考勤系统
                  </span>
                </Button>
              </div>
              <div data-ui="toolbar" className="import-footer-actions">
                <Button
                  id="commitImport"
                  disabled
                  className="hw-button ui-button primary"
                  htmlType="button"
                >
                  <svg className="ui-icon" aria-hidden="true">
                    <use href="#icon-check" />
                  </svg>
                  <span
                    className="button-label"
                    data-i18n-text='{"0":"copy.de6433b70d"}'
                  >
                    确认导入
                  </span>
                </Button>
              </div>
            </div>
            <section
              className="sidebar-import-history"
              aria-label="导入历史"
              data-i18n-aria-label="copy.dc71cd204d"
            >
              <div className="sidebar-history-heading">
                <h3 id="importResultsTitle">导入历史</h3>
                <span
                  id="importHistoryCount"
                  className="muted"
                  aria-live="polite"
                ></span>
              </div>
              <div className="sidebar-history-scroll">
                <ImportHistory />
                <div id="importDetails" className="hidden">
                  <div
                    id="importWarnings"
                    className="warnings"
                    role="alert"
                  ></div>
                  <div id="importTable" className="hidden">
                    <ImportRows />
                  </div>
                </div>
              </div>
            </section>
          </dialog>

          <dialog
            id="sourceDialog"
            className="sidebar-oa-pane"
            aria-modal="false"
            data-ui="dialog"
          >
            <div className="dialog-head">
              <h2 data-i18n-text='{"0":"copy.d82c9100ca"}'>记录来源</h2>
              <Button
                data-close="sourceDialog"
                aria-label="关闭"
                data-i18n-aria-label="copy.6c14bd7f6f"
                className="hw-button ui-button"
                htmlType="button"
              >
                <svg className="ui-icon" aria-hidden="true">
                  <use href="#icon-close" />
                </svg>
              </Button>
            </div>
            <div id="sourceBody" className="dialog-body"></div>
          </dialog>
        </div>
      </aside>
    </>
  );
}
