import Button from "antd/es/button";
import { lazy, Suspense } from "react";
const Conflict = lazy(() => import("./Conflict"));
import { TrashIcon } from "../phosphor-icons";
import { useLanguage } from "../ApplicationTheme";
import { records, useImportRecords } from "./records";
export function ImportRows() {
  const { rows, choices } = useImportRecords();
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <div id="importRows" className="import-parsed-list">
      {rows.map((row, index) => (
        <article key={row.date + "-" + index}>
          <strong>{row.date.replaceAll("-", "/")}</strong>
          <span>{row.time}</span>
          <span
            className={
              row.restDay ? "import-record-rest-day" : "import-record-anomaly"
            }
          >
            {row.restDay || row.anomaly}
          </span>
          {row.conflict && (
            <>
              <div className="conflict">{row.conflict}</div>
              <Suspense fallback={null}>
                <Conflict
                  index={index}
                  date={row.date}
                  choice={choices[index]}
                />
              </Suspense>
            </>
          )}
          {row.manual && <div className="muted">{t("oa.manual")}</div>}
        </article>
      ))}
    </div>
  );
}
export function ImportHistory() {
  const { history } = useImportRecords();
  useLanguage();
  const { t } = WorkTimeApp.i18n;
  return (
    <div id="importHistoryList">
      {history.map((log) => (
        <article
          key={log.id}
          className="import-history-item"
          data-history-id={log.id}
        >
          <div className="row between">
            <h3>{log.when}</h3>
            <div className="row">
              <Button
                data-view-import={log.id}
                aria-label={t("oa.details")}
                data-hint-text={t("oa.details")}
                className="hw-button ui-button"
              >
                <svg className="ui-icon" aria-hidden="true">
                  <use href="#icon-info" />
                </svg>
              </Button>
              <Button
                data-delete-import={log.id}
                aria-label={t("oa.remove")}
                data-hint-text={t("oa.remove")}
                className="hw-button ui-button danger"
              >
                <TrashIcon className="ui-icon" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="import-history-meta">
            {log.range} · {t("oa.records", { count: String(log.count) })}
          </div>
        </article>
      ))}
      {!history.length && (
        <div className="import-history-empty">{t("oa.empty")}</div>
      )}
    </div>
  );
}
