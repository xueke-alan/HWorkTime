import { Books, type BooksProps } from "./Books";
import { Study, MiniStudy, type StudyProps, type MiniProps } from "./Study";
import Button from "antd/es/button";
import Modal from "antd/es/modal";
import Select from "antd/es/select";
import Switch from "antd/es/switch";
import { useRef, useState } from "react";
import { mountView } from "../mount-view";

const t = (key: string) => WorkTimeApp.i18n.t("vocabulary." + key);
type Metrics = Record<string, number>;
interface Day {
  day: string;
  fresh: number;
  reviews: number;
}
interface Report {
  days: Day[];
  total: number;
  learned: number;
  feedback: number[];
}

function MetricRow({ values }: { values: Metrics }) {
  return (
    <div className="vocabulary-stats">
      {Object.entries(values).map(([key, value]) => (
        <div key={key}>
          <strong>{value}</strong>
          <span>{t(key)}</span>
        </div>
      ))}
    </div>
  );
}

function Activity({ values, report }: { values: Metrics; report: Report }) {
  const days = report.days.slice(-30);
  const max = Math.max(1, ...days.map((day) => day.fresh + day.reviews));
  return (
    <>
      <MetricRow values={values} />
      <h3>{t("recentActivity")}</h3>
      <svg
        viewBox="0 0 280 114"
        role="img"
        aria-label={t("recentActivity")}
        className="vocabulary-chart"
      >
        {days.flatMap((day, i) =>
          (["fresh", "reviews"] as const).map((name) => {
            const height = (day[name] / max) * 85;
            return (
              <rect
                key={day.day + name}
                x={i * 9 + 6}
                y={
                  94 -
                  height -
                  (name === "reviews" ? (day.fresh / max) * 85 : 0)
                }
                width={5}
                height={height}
                rx={1}
                className={"vocabulary-bar-" + name}
                data-hint="detail"
                data-hint-text={`${day.day} · ${t(name === "reviews" ? "reviewCount" : "newLearned")} ${day[name]}`}
              />
            );
          }),
        )}
      </svg>
      <div className="vocabulary-chart-legend">
        <span className="vocabulary-legend-new">{t("newLearned")}</span>
        <span className="vocabulary-legend-review">{t("reviewCount")}</span>
      </div>
      {!report.total && <p className="vocabulary-muted">{t("noActivity")}</p>}
      <h3>{t("activityCalendar")}</h3>
      <div className="vocabulary-heatmap" aria-label={t("activityCalendar")}>
        {report.days.map((day) => {
          const count = day.fresh + day.reviews;
          return (
            <span
              key={day.day}
              data-level={count === 0 ? 0 : count < 10 ? 1 : count < 30 ? 2 : 3}
              data-hint-text={day.day + " · " + t("today") + " " + count}
            >
              {day.day.slice(-2)}
            </span>
          );
        })}
      </div>
      <h3>{t("latestFeedback")}</h3>
      <div className="vocabulary-feedback">
        {["again", "hard", "good", "easy"].map((key, i) => (
          <div key={key}>
            <span>{t(key)}</span>
            <progress
              max={Math.max(1, report.learned)}
              value={report.feedback[i]}
              aria-label={t(key)}
            />
            <strong>{report.feedback[i]}</strong>
          </div>
        ))}
      </div>
      <p className="vocabulary-muted">{t("feedbackHint")}</p>
    </>
  );
}

interface Settings {
  disabled: boolean;
  accent: string;
  autoRead: boolean;
  autoCache: boolean;
  limit: number;
  limits: number[];
  poolSize: number | "auto";
  poolSizes: (number | "auto")[];
  modelStatus: string;
  importing: boolean;
  setAccent: (value: string) => void;
  setAutoRead: (value: boolean) => void;
  setAutoCache: (value: boolean) => void;
  setPool: (value: number | "auto") => void;
  setLimit: (value: number) => void;
  clear: () => Promise<void>;
  install: (file: File) => void;
}
function Preferences(p: Settings) {
  const upload = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  return (
    <>
      <div className="vocabulary-switch-row">
        <span>
          {t("accent")}
          <small className="vocabulary-accent-caution">
            {t("accentCaution")}
          </small>
        </span>
        <Switch
          aria-label={t("accent") + ": " + t(p.accent)}
          data-setting="accent"
          disabled={p.disabled}
          checked={p.accent === "us"}
          unCheckedChildren={t("shortUK")}
          checkedChildren={t("shortUS")}
          onChange={(us) => p.setAccent(us ? "us" : "uk")}
        />
      </div>
      {(["autoRead", "autoCache"] as const).map((key) => (
        <div key={key} className="vocabulary-switch-row">
          <span>{t(key)}</span>
          <Switch
            data-setting={key}
            aria-label={t(key)}
            disabled={p.disabled}
            checked={p[key]}
            onChange={key === "autoRead" ? p.setAutoRead : p.setAutoCache}
          />
        </div>
      ))}
      <div className="vocabulary-resource-settings">
        <div className="vocabulary-field">
          <span>{t("workerPool")}</span>
          <Select
            virtual={false}
            aria-label={t("workerPool")}
            value={p.poolSize}
            disabled={p.disabled}
            onChange={p.setPool}
            options={p.poolSizes.map((value) => ({
              value,
              label: value === "auto" ? t("workerAuto") : String(value),
              title: "",
            }))}
          />
        </div>
        <div className="vocabulary-field vocabulary-capacity">
          <span>{t("cacheCapacity")}</span>
          <Select
            virtual={false}
            aria-label={t("cacheCapacity")}
            value={p.limit}
            disabled={p.disabled}
            onChange={p.setLimit}
            options={p.limits.map((value) => ({
              value,
              title: "",
              label:
                value === Number.MAX_SAFE_INTEGER
                  ? t("cacheUnlimited")
                  : value / 1024 ** 3 + " GiB",
            }))}
          />
        </div>
      </div>
      <div className="vocabulary-management-groups">
        <section className="vocabulary-model-settings">
          <h4>{t("modelGroup")}</h4>
          <div className="vocabulary-cache-actions">
            <Button
              data-model-action="download"
              disabled={p.disabled}
              onClick={() =>
                window.open(
                  "https://github.com/xueke-alan/WorkTime/releases",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              {t("modelDownloadShort")}
            </Button>
            <Button
              data-model-action="import"
              disabled={p.disabled || p.importing}
              onClick={() => upload.current?.click()}
            >
              {t("modelImportShort")}
            </Button>
            <Button
              className="vocabulary-clear-cache"
              aria-haspopup="dialog"
              disabled={p.disabled || clearing}
              onClick={() => setConfirming(true)}
            >
              {t("cacheClearShort")}
            </Button>
          </div>
        </section>
      </div>
      <input
        type="file"
        hidden
        accept=".wtmodels"
        ref={upload}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) p.install(file);
        }}
      />
      <p className="vocabulary-model-status" role="status">
        {p.modelStatus && t(p.modelStatus)}
      </p>
      <Modal
        open={confirming}
        title={t("clear")}
        okText={t("confirm")}
        cancelText={t("cancel")}
        cancelButtonProps={{ autoFocus: true }}
        onCancel={() => setConfirming(false)}
        onOk={async () => {
          setConfirming(false);
          setClearing(true);
          try {
            await p.clear();
          } finally {
            setClearing(false);
          }
        }}
      >
        <p>{t("clearCacheConfirm")}</p>
      </Modal>
    </>
  );
}

export function mountVocabularyPage(host: HTMLElement) {
  const view = mountView(host);
  return {
    home(streak: number, values: Metrics) {
      view.render(
        <div className="vocabulary-summary">
          <section className="vocabulary-hero">
            <span className="vocabulary-eyebrow">{t("streak")}</span>
            <strong className="vocabulary-streak">
              {String(streak).padStart(2, "0")}
            </strong>
          </section>
          <MetricRow values={values} />
        </div>,
      );
    },
    analysis(values: Metrics, report: Report) {
      view.render(<Activity values={values} report={report} />);
    },
    preferences(props: Settings) {
      view.render(<Preferences {...props} />);
    },
    books(props: BooksProps) {
      view.render(<Books {...props} />);
    },
    study(props: StudyProps) {
      view.render(<Study {...props} />);
    },
    mini(props: MiniProps) {
      view.render(<MiniStudy {...props} />);
    },
    complete() {
      view.render(<p className="vocabulary-complete">{t("complete")}</p>);
    },
    dispose: view.dispose,
  };
}
