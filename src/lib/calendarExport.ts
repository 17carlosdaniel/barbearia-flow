/**
 * Gera link para adicionar evento ao Google Calendar.
 * Em produção usar dados reais do agendamento.
 */
export function getGoogleCalendarUrl(params: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}): string {
  const format = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const text = encodeURIComponent(params.title);
  const details = encodeURIComponent(params.description ?? "");
  const loc = encodeURIComponent(params.location ?? "");
  const start = format(params.start);
  const end = format(params.end);
  return `${base}&text=${text}&details=${details}&location=${loc}&dates=${start}/${end}`;
}

/**
 * Gera arquivo .ics para download (iCal / Apple Calendar / Outlook).
 */
export function getIcalContent(params: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}): string {
  const format = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Barbeflow//Agendamento//PT",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@barbeflow`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(params.start)}`,
    `DTEND:${format(params.end)}`,
    `SUMMARY:${params.title.replace(/\n/g, " ")}`,
    params.description ? `DESCRIPTION:${params.description.replace(/\n/g, " ")}` : "",
    params.location ? `LOCATION:${params.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcal(params: Parameters<typeof getIcalContent>[0], filename = "agendamento-barbeflow.ics") {
  const blob = new Blob([getIcalContent(params)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
