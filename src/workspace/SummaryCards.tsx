import Card from "antd/es/card";
import { useLayoutEffect, useRef } from "react";
import { mountView } from "../mount-view";

interface NumberOptions {
  unit: string;
  decimals?: number | null;
  alignInk?: boolean;
  placeholder?: string;
}
type Value = number | string | null;
type Paint = (
  element: HTMLElement,
  value: Value,
  options: NumberOptions,
) => void;
interface Metric {
  label: string;
  title: string;
  description: string;
  hint: string;
  value: Value;
  options: NumberOptions;
}
interface Target {
  total: Value;
  daily: Value;
  target: Value;
  restDays: number | null;
  message: string;
  dailyLabel: string;
  totalLabel: string;
  totalTitle: string;
  remainingText: string[] | null;
  remainingCount: string;
}
export interface SummaryProps {
  metrics: Metric[];
  target: Target;
  negative: boolean;
  paint: Paint;
}
function NumberValue({
  paint,
  value,
  unit,
  decimals,
  placeholder,
  className,
}: NumberOptions & { value: Value; paint: Paint; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (ref.current)
      paint(ref.current, value, {
        unit,
        decimals,
        placeholder,
        alignInk: true,
      });
  }, [paint, value, unit, decimals, placeholder]);
  return <span className={className} ref={ref} />;
}
function Summary({ metrics, target, negative, paint }: SummaryProps) {
  const { t } = WorkTimeApp.i18n;
  const [attendance, workOvertime, restOvertime, totalHours, pending] =
    metrics.slice(2);
  return (
    <>
      {["average", "target", "balance", "totals"].map((kind) => {
        const index = kind === "balance" ? 1 : 0;
        const metric = metrics[index];
        const minutes = Number(metric.value);
        return (
          <Card
            key={kind}
            className="overview-metric-card"
            data-summary-card={kind}
            data-summary-metric={
              kind === "average" || kind === "balance" ? kind : undefined
            }
          >
            {kind === "target" ? (
              <>
                <div className="overview-metric-heading">
                  <strong data-hint-text={t("copy.ac05786a10")}>
                    {t("short.target")}
                  </strong>
                  <strong id="targetValue">
                    <NumberValue
                      paint={paint}
                      value={target.target}
                      decimals={1}
                      unit="h"
                      placeholder="-"
                    />
                  </strong>
                </div>
                <div className="overview-target-details">
                  <div
                    id="targetCounts"
                    className="overview-detail-row"
                    hidden={target.restDays === null}
                  >
                    <span>{t("short.restOT")}</span>
                    <strong>
                      {target.restDays !== null &&
                        WorkTimeApp.i18n.number(target.restDays)}{" "}
                      <small>d</small>
                    </strong>
                  </div>
                  <div id="targetResult" aria-live="polite">
                    {target.message}
                  </div>
                  <div
                    className="overview-detail-row"
                    id="targetTotalRow"
                    hidden={target.total === null}
                  >
                    <span
                      id="targetTotalLabel"
                      data-hint-text={target.totalTitle}
                      aria-label={target.totalTitle}
                    >
                      {target.remainingText === null ? (
                        target.totalLabel
                      ) : (
                        <>
                          {target.remainingText[0]}
                          <span className="fixed-remaining-count">
                            {target.remainingCount}
                          </span>
                          {target.remainingText[1]}
                        </>
                      )}
                    </span>
                    <strong
                      id="targetMetric"
                      aria-labelledby="targetTotalLabel"
                    >
                      <NumberValue
                        paint={paint}
                        value={target.total}
                        unit="h"
                        decimals={null}
                        placeholder="-"
                      />
                    </strong>
                  </div>
                  <div className="overview-detail-row" id="targetDailyRow">
                    <span id="targetDailyLabel">{target.dailyLabel}</span>
                    <strong
                      id="targetDailyMetric"
                      aria-labelledby="targetDailyLabel"
                    >
                      <NumberValue
                        paint={paint}
                        value={target.daily}
                        unit={target.daily === null ? "" : "h/d"}
                        decimals={2}
                      />
                    </strong>
                  </div>
                </div>
              </>
            ) : kind === "totals" ? (
              <dl className="overview-totals">
                {[
                  totalHours,
                  attendance,
                  workOvertime,
                  restOvertime,
                  pending,
                ].map((m) => (
                  <div
                    key={m.title}
                    data-summary-metric=""
                    className={
                      m === totalHours
                        ? "overview-metric-heading"
                        : "overview-detail-row"
                    }
                  >
                    <dt
                      data-stat-label=""
                      data-hint-text={m.title}
                      aria-label={m.title}
                    >
                      {m.label}
                    </dt>
                    <dd data-stat-value="">
                      <NumberValue
                        paint={paint}
                        value={m.value}
                        {...m.options}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <>
                <div className="overview-metric-heading">
                  <strong
                    data-stat-label=""
                    data-hint-text={metric.title}
                    aria-label={metric.title}
                  >
                    {metric.label}
                  </strong>
                  <strong
                    data-stat-value=""
                    className={
                      kind === "balance" && negative ? "is-negative" : undefined
                    }
                  >
                    {kind === "balance" ? (
                      metric.value === null ? (
                        "—"
                      ) : (
                        <>
                          <NumberValue
                            paint={paint}
                            className="surplus-hours"
                            value={
                              (negative ? "-" : "") + Math.floor(minutes / 60)
                            }
                            unit="h"
                          />
                          <NumberValue
                            paint={paint}
                            className="surplus-minutes"
                            value={minutes % 60}
                            unit="m"
                          />
                        </>
                      )
                    ) : (
                      <NumberValue
                        paint={paint}
                        value={metric.value}
                        {...metric.options}
                      />
                    )}
                  </strong>
                </div>
                <div data-stat-description="" data-hint-text={metric.hint}>
                  {metric.description}
                </div>
              </>
            )}
          </Card>
        );
      })}
    </>
  );
}
export function mountSummary(host: HTMLElement) {
  const view = mountView(host);
  return {
    render: (props: SummaryProps) => view.render(<Summary {...props} />),
    dispose: view.dispose,
  };
}
