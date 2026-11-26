import Button from "antd/es/button";
import { useLanguage } from "../ApplicationTheme";
interface Item {
  id: string;
  title: string;
  status: string;
  note: string;
  time: string;
  statusLabel: string;
}
export function AgendaList({
  items,
  disabled,
}: {
  items: Item[];
  disabled: boolean;
}) {
  useLanguage();
  const t = (key: string) => WorkTimeApp.i18n.t("agenda." + key);
  if (!items.length)
    return (
      <div className="agenda-empty">
        <svg className="ui-icon" aria-hidden="true">
          <use href="#icon-event-note" />
        </svg>
        <p>{t("empty")}</p>
      </div>
    );
  return items.map((item) => (
    <div
      key={item.id}
      className={
        "agenda-item" + (item.status === "completed" ? " is-complete" : "")
      }
    >
      <Button
        data-ui="button"
        className="agenda-complete"
        data-agenda-status={item.id}
        data-status={item.status}
        aria-haspopup="menu"
        aria-controls="agendaStatusMenu"
        aria-expanded={false}
        data-hint-text={item.statusLabel}
        disabled={disabled}
        aria-label={
          t("changeStatus") + ": " + item.statusLabel + " · " + item.title
        }
      />
      <Button
        data-ui="button"
        className="agenda-item-copy"
        data-agenda-edit={item.id}
      >
        <strong>{item.title}</strong>
        <small>{item.time}</small>
        {item.note && <span className="agenda-note">{item.note}</span>}
      </Button>
      <Button
        data-ui="button"
        className="agenda-delete"
        data-agenda-delete={item.id}
        aria-label={t("delete") + " · " + item.title}
        disabled={disabled}
      >
        <svg className="ui-icon" aria-hidden="true">
          <use href="#icon-delete-outline" />
        </svg>
      </Button>
    </div>
  ));
}
interface OverviewGroup {
  key: string;
  count: number;
  expanded: boolean;
  items: { id: string; title: string; time: string }[];
}
export function AgendaOverview({ groups }: { groups: OverviewGroup[] }) {
  useLanguage();
  const t = (key: string, count?: number) =>
    WorkTimeApp.i18n.t(
      "agenda." + key,
      count === undefined ? {} : { count: String(count) },
    );
  return (
    <>
      <h2>{t("pendingOverview")}</h2>
      {!groups.length && (
        <p className="agenda-overview-empty">{t("pendingEmpty")}</p>
      )}
      {groups.map((group) => (
        <section
          key={group.key}
          className={"agenda-overview-section agenda-overview-" + group.key}
        >
          <h3>
            {t(group.key)} <span className="agenda-count">{group.count}</span>
          </h3>
          <div className="agenda-overview-items">
            {group.items.map((item) => (
              <Button
                key={item.id}
                data-ui="button"
                className="agenda-summary-link"
                data-agenda-jump={item.id}
              >
                <span>{item.title}</span>
                <small>{item.time}</small>
              </Button>
            ))}
          </div>
          {group.count > 3 && (
            <Button
              data-ui="button"
              className="ui-button agenda-expand"
              data-agenda-expand={group.key}
              aria-expanded={group.expanded}
            >
              {t(group.expanded ? "showLess" : "showAll", group.count)}
            </Button>
          )}
        </section>
      ))}
    </>
  );
}
