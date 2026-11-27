import Card from "antd/es/card";
import { useRef, useLayoutEffect } from "react";
import { metrics, type Metric } from "./metrics";
function MetricCard({
  metric,
  paint,
}: {
  metric: Metric;
  paint: (element: HTMLElement, value: string, delay: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    paint(ref.current!, metric.numeric, 0);
  }, [paint, metric.numeric]);
  return (
    <div className="analysis-metric" data-key={metric.key}>
      <span data-hint-text={metric.title}>{metric.label}</span>
      <strong ref={ref} />
      <div className="analysis-metric-footer">
        {metric.dates.length ? (
          <small className="analysis-metric-dates">
            {metric.dates.slice(0, 2).map((date) => (
              <span key={date}>{date}</span>
            ))}
          </small>
        ) : (
          <small>{metric.context}</small>
        )}
        {metric.dates.length > 2 && (
          <span className="analysis-date-more">
            +{metric.remainingDateCount}
          </span>
        )}
      </div>
    </div>
  );
}
export default function AnalysisMetrics() {
  const { value } = metrics.useSnapshot();
  return (
    <div id="analysisMetrics" className="analysis-metrics">
      {value?.groups.map((group) => (
        <Card
          key={group.key}
          size="small"
          title={<h3 id={"analysis-group-" + group.key}>{group.title}</h3>}
          data-key={"group-" + group.key}
          className={"analysis-metric-group analysis-metric-group-" + group.key}
          role="group"
          aria-labelledby={"analysis-group-" + group.key}
          data-hint-text={group.description || undefined}
          aria-description={group.description || undefined}
        >
          {group.items.map((metric) => (
            <MetricCard key={metric.key} metric={metric} paint={value.paint} />
          ))}
        </Card>
      ))}
    </div>
  );
}
