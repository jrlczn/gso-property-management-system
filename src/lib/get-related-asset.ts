export type RelatedAsset = {
  asset_code?: string | null;
  asset_name?: string | null;
  category_id?: number | null;
};

export function getRelatedAsset(
  relation: unknown,
): RelatedAsset | null {
  const asset = Array.isArray(relation)
    ? relation[0]
    : relation;

  if (!asset || typeof asset !== "object") {
    return null;
  }

  return asset as RelatedAsset;
}
