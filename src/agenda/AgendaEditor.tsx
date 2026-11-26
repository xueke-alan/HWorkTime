import Button from "antd/es/button";
import Input from "antd/es/input";
import Select from "antd/es/select";
import { CaretDownIcon } from "../phosphor-icons";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../ApplicationTheme";
import type { Draft, EditorOptions, Status } from "./mount";

const statuses: { value: Status; key: string }[] = [
  { value: "pending", key: "statusPending" },
  { value: "completed", key: "statusCompleted" },
  { value: "in-progress", key: "statusInProgress" },
  { value: "cancelled", key: "statusCancelled" },
];
type Props = EditorOptions & {
  change(patch: Partial<Draft>): void;
  view: { editing: boolean; busy: boolean; locked: boolean };
};
export function AgendaEditor({
  draft,
  view,
  schedule,
  footer,
  cancel,
  change,
}: Props) {
  useLanguage();
  const scheduleHost = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    scheduleHost.current?.append(schedule);
    return () => schedule.remove();
  }, [schedule]);
  const t = (key: string) => WorkTimeApp.i18n.t("agenda." + key);
  const saveLabel = t(view.editing ? "saveChanges" : "createItem");
  return (
    <>
      <div className="agenda-field agenda-title-field">
        <label htmlFor="agendaTitle">{t("title")}</label>
        <Input.TextArea
          id="agendaTitle"
          rows={1}
          maxLength={120}
          required
          autoComplete="off"
          placeholder={t("titlePlaceholder")}
          className="hw-field"
          value={draft.title}
          onChange={(event) => change({ title: event.target.value })}
        />
      </div>
      <div className="agenda-properties">
        <div className="agenda-field agenda-status-field">
          <label id="agendaItemStatusLabel" htmlFor="agendaItemStatus">
            {t("status")}
          </label>
          <div className="agenda-status-input" data-status={draft.status}>
            <span className="agenda-status-dot" aria-hidden="true" />
            <Select
              virtual={false}
              id="agendaItemStatus"
              aria-labelledby="agendaItemStatusLabel"
              value={draft.status}
              options={statuses.map(({ value, key }) => ({
                value,
                label: t(key),
                title: "",
              }))}
              disabled={view.locked}
              onChange={(status) => change({ status })}
              suffixIcon={<CaretDownIcon size={16} aria-hidden="true" />}
            />
          </div>
        </div>
        <div ref={scheduleHost} />
      </div>
      <div className="agenda-field agenda-note-field">
        <label htmlFor="agendaNote">{t("note")}</label>
        <Input.TextArea
          id="agendaNote"
          rows={3}
          maxLength={5000}
          placeholder={t("notePlaceholder")}
          className="hw-field"
          value={draft.note}
          onChange={(event) => change({ note: event.target.value })}
        />
      </div>
      {createPortal(
        <>
          <Button
            id="agendaCancel"
            disabled={view.busy}
            onClick={cancel}
            className="ui-button"
            data-variant="secondary"
          >
            {t("cancel")}
          </Button>
          <Button
            id="agendaSave"
            form="agendaForm"
            htmlType="submit"
            type="primary"
            disabled={view.locked || !draft.title.trim()}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            data-hint-text={saveLabel + " (Ctrl/⌘ + Enter)"}
            className="ui-button primary"
          >
            {saveLabel}
          </Button>
        </>,
        footer,
      )}
    </>
  );
}
