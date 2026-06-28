export type CsvCell = string | number | boolean | null | undefined;

function escapeCsvCell(cell: CsvCell) {
  const value = cell === null || cell === undefined ? "" : String(cell);
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: string[], rows: CsvCell[][]) {
  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n");
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
