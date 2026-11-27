import Compact from "antd/es/space/Compact";
import Button from "antd/es/button";
export interface TemplateItem {
  id: string;
  name: string;
  start: string;
  end: string;
  nextDay: boolean;
}
export default function TimeTemplates({
  items,
  batch,
  edit,
  nextDay,
}: {
  items: TemplateItem[];
  batch: boolean;
  edit: string;
  nextDay: string;
}) {
  return items.map((item) => (
    <Compact
      key={item.id}
      className="time-template-chip"
      data-ui="group"
      role="group"
    >
      <Button
        data-ui="button"
        data-batch-template={batch ? item.id : undefined}
        data-template-fill={batch ? undefined : item.id}
        data-hint-text={
          item.name +
          " · " +
          item.start +
          "–" +
          item.end +
          (item.nextDay ? nextDay : "")
        }
        className="hw-button ui-button template-fill"
      >
        <span className="button-label">{item.name}</span>
      </Button>
      <Button
        data-ui="button"
        data-batch-template-edit={batch ? item.id : undefined}
        data-template-edit={batch ? undefined : item.id}
        aria-label={edit + " " + item.name}
        data-hint-text={edit}
        className="hw-button ui-button template-edit icon-only"
      >
        <svg className="ui-icon" aria-hidden="true">
          <use href="#icon-more-horiz" />
        </svg>
      </Button>
    </Compact>
  ));
}
