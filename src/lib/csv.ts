/**
 * Minimal RFC-4180-ish CSV parser — handles quoted fields, escaped quotes
 * (""), commas and newlines inside quotes, and CRLF/LF line endings. Returns
 * an array of row objects keyed by the (trimmed, lowercased) header row. No
 * external dependency. Safe to run in the browser and on the server.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const src = text.replace(/^﻿/, ""); // strip BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      // Skip fully-empty lines.
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  // Flush the last field/row if the file didn't end with a newline.
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}
