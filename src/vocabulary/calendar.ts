export interface ActivityDay {
  day: string;
  fresh: number;
  reviews: number;
}

/** Show the current month in complete Monday-to-Sunday weeks. */
export function studyCalendar(days: readonly ActivityDay[]) {
  const today = new Date();
  const [year, month] = days.at(-1)?.day.split("-").map(Number) ?? [
    today.getFullYear(),
    today.getMonth() + 1,
  ];
  const start = new Date(year, month - 1, 1, 12);
  start.setDate(1 - ((start.getDay() + 6) % 7));
  const end = new Date(year, month, 0, 12);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
  const indexed = new Map(days.map((day) => [day.day, day]));
  const calendar = [];
  for (
    const date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    calendar.push({
      ...(indexed.get(key) ?? { day: key, fresh: 0, reviews: 0 }),
      outsideMonth: date.getMonth() !== month - 1,
    });
  }
  return calendar;
}
