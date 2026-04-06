export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const isoDatePart = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoDatePart) {
      return isoDatePart[1];
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return "";
  }

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function formatDate(value?: string | Date | null, fallback = "\u2014"): string {
  return toDateInputValue(value) || fallback;
}
