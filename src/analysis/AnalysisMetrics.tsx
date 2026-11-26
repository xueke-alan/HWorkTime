import Button from "antd/es/button";
import { useRef, useLayoutEffect, useState } from "react";
import { metrics, type Metric } from "./metrics";
function MetricCard({
  metric,
  paint,
}: {
  metric: Metric;
  paint: (element: HTMLElement, value: string, delay: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  useLayoutEffect(() => {
    paint(ref.current!, metric.numeric, 0);
  }, [paint, metric.numeric]);
  const id = "metric-dates-" + metric.key;
  return (
    <div className="analysis-metric" data-key={metric.key}>
      <span data-hint-text={metric.title}>{metric.label}</span>
      <strong ref={ref} />
      <div className="analysis-metric-footer">
        <small>{metric.context}</small>
        {metric.dates.length > 1 && (
          <div className="analysis-date-disclosure">
            <Button
              aria-label={metric.dateHint}
              aria-controls={id}
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
              className="hw-button"
            >
              +{metric.dateCount}
            </Button>
            <p id={id} className="analysis-date-hint" hidden={!expanded}>
              {metric.dates.join(" · ")}
            </p>
          </div>
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
        <section
          key={group.key}
          data-key={"group-" + group.key}
          className={"analysis-metric-group analysis-metric-group-" + group.key}
          data-hint-text={group.description || undefined}
          aria-description={group.description || undefined}
        >
          <h3>{group.title}</h3>
          {group.items.map((metric) => (
            <MetricCard key={metric.key} metric={metric} paint={value.paint} />
          ))}
        </section>
      ))}
    </div>
  );
}
