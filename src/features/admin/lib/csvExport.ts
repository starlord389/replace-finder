export type CsvValue = string | number | boolean | null | undefined;

function neutralizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function escapeCsvValue(value: CsvValue) {
  const raw = value == null ? "" : String(value);
  const safe = neutralizeSpreadsheetFormula(raw);
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: string[], rows: CsvValue[][]) {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  const blob = new Blob([`\uFEFF${buildCsv(headers, rows)}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
