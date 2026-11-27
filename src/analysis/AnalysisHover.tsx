import ConfigProvider from "antd/es/config-provider";
import Descriptions from "antd/es/descriptions";
import Popover from "antd/es/popover";
import Tag from "antd/es/tag";
import type { TooltipRef } from "antd/es/tooltip";
import { useLayoutEffect, useRef } from "react";
import { hover, type HoverView } from "./hover";
import "../styles/analysis-hover.css";

// The global 8px radii exceed the arrow's half-height and flatten its tip.
const hoverTheme = { token: { borderRadiusXS: 2, borderRadiusOuter: 2 } };

export function AnalysisHoverContent({ view }: { view: HoverView }) {
  return (
    <div
      id="analysisHover"
      className="analysis-hover-content"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="analysis-hover-heading">
        <strong>{view.date}</strong>
        <span>{view.weekday}</span>
      </div>
      <Descriptions
        size="small"
        column={1}
        colon={false}
        className="analysis-hover-values"
        items={view.rows.map((row) => ({
          key: row.key,
          label: (
            <>
              <span>{row.label}</span>
              {row.tags?.map((tag) => (
                <Tag
                  key={tag.key}
                  variant="filled"
                  className="analysis-hover-row-tag"
                >
                  {tag.label}
                </Tag>
              ))}
            </>
          ),
          children: (
            <span
              className={
                row.key === "overtime" ? "analysis-hover-overtime" : undefined
              }
            >
              {row.value}
            </span>
          ),
        }))}
      />
    </div>
  );
}

export default function AnalysisHover() {
  const { value, left, top } = hover.useSnapshot();
  const popup = useRef<TooltipRef>(null);
  useLayoutEffect(() => {
    if (value) popup.current?.forceAlign();
  }, [value, left, top]);
  return (
    <ConfigProvider theme={hoverTheme}>
      <Popover
        ref={popup}
        open={Boolean(value)}
        trigger={[]}
        placement="top"
        arrow={{ pointAtCenter: true }}
        autoAdjustOverflow
        destroyOnHidden
        color="var(--theme-surface-paper, var(--paper))"
        classNames={{ root: "analysis-hover-popover" }}
        styles={{ container: { padding: "8px 10px" } }}
        content={value && <AnalysisHoverContent view={value} />}
      >
        <span
          className="analysis-hover-anchor"
          aria-hidden="true"
          style={{ left, top }}
        />
      </Popover>
    </ConfigProvider>
  );
}
