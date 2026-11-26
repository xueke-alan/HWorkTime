import Select from "antd/es/select";
import { records } from "./records";
export default function Conflict({
  index,
  date,
  choice,
}: {
  index: number;
  date: string;
  choice: string;
}) {
  const { t } = WorkTimeApp.i18n;
  return (
    <Select
      data-conflict={index}
      value={choice || "new"}
      aria-label={t("oa.conflict", { date: date })}
      options={["new", "old"].map((value) => ({
        value,
        label: t("oa." + value),
        title: "",
      }))}
      onChange={(value) => {
        records.choices = { ...records.choices, [index]: value };
      }}
    />
  );
}
