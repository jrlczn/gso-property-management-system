/**
 * Plain-language messages for records that cannot be deleted because other
 * records still use them. The database protects these links on purpose (for
 * example an officer who was issued assets, or a department that appears in
 * past movements), so the app checks first and explains what is in the way.
 */

export type Usage = { count: number | null; singular: string; plural: string };

/** "4 officers, 9 assets and 12 movement records" - empty if nothing is used. */
export function joinUsage(usage: Usage[]): string {
  const parts = usage
    .filter((u) => (u.count ?? 0) > 0)
    .map((u) => `${u.count} ${u.count === 1 ? u.singular : u.plural}`);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** The message to show when the record is in use, or null when it is free to delete. */
export function blockedMessage(
  label: string,
  usage: Usage[],
  advice: string,
): string | null {
  const used = joinUsage(usage);
  if (!used) return null;
  return `"${label}" can't be deleted because it is still linked to ${used}. ${advice}`;
}

/**
 * Safety net for a delete the database still refuses after the checks above
 * (error code 23503 = other records still use this one).
 */
export function deleteErrorMessage(
  error: { code?: string; message: string },
  label: string,
  advice: string,
): string {
  if (error.code === "23503") {
    return `"${label}" can't be deleted because other records in the system still use it. ${advice}`;
  }
  return error.message;
}
