import type { Advantage } from "@/types/advantages";
import type { Power } from "@/types/powers";

export type TagSearchColumn = "apply" | "refresh" | "synergy";
export type TooltipTagCategory = "apply" | "refresh" | "synergy";
export type TooltipTagBadge = {
  categories: TooltipTagCategory[];
  label: string;
};

type TagSource = Pick<
  Power | Advantage,
  "apply_tag" | "filter_tag" | "refresh_tag" | "synergy_tag"
>;

function toTagValues(value: string[] | string | null | undefined) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((tag) => String(tag).split(";"))
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>();

  return tags.filter((tag) => {
    const key = tag.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeTagKey(tag: string) {
  return tag.toLowerCase().replace(/\s+/g, " ").trim();
}

function getScopedTagValues(source: TagSource, column: TagSearchColumn) {
  if (column === "apply") {
    return toTagValues(source.apply_tag);
  }

  if (column === "refresh") {
    return toTagValues(source.refresh_tag);
  }

  return toTagValues(source.synergy_tag);
}

export function getSearchTags(
  source: TagSource,
  columns: TagSearchColumn[] = [],
) {
  if (columns.length > 0) {
    return uniqueTags(
      columns.flatMap((column) => getScopedTagValues(source, column)),
    );
  }

  return uniqueTags([
    ...toTagValues(source.apply_tag),
    ...toTagValues(source.refresh_tag),
    ...toTagValues(source.synergy_tag),
    ...toTagValues(source.filter_tag),
  ]);
}

export function getTooltipTags(source: TagSource) {
  return getSearchTags(source);
}

export function getTooltipTagBadges(source: TagSource): TooltipTagBadge[] {
  const taggedValues: Array<{
    category: TagSearchColumn | "filter";
    label: string;
  }> = [
    ...toTagValues(source.apply_tag).map((label) => ({
      category: "apply" as const,
      label,
    })),
    ...toTagValues(source.refresh_tag).map((label) => ({
      category: "refresh" as const,
      label,
    })),
    ...toTagValues(source.synergy_tag).map((label) => ({
      category: "synergy" as const,
      label,
    })),
    ...toTagValues(source.filter_tag).map((label) => ({
      category: "filter" as const,
      label,
    })),
  ];
  const badgesByKey = new Map<
    string,
    { categories: Set<TagSearchColumn | "filter">; label: string }
  >();

  taggedValues.forEach(({ category, label }) => {
    const key = normalizeTagKey(label);
    const badge = badgesByKey.get(key) ?? {
      categories: new Set<TagSearchColumn | "filter">(),
      label,
    };

    badge.categories.add(category);
    badgesByKey.set(key, badge);
  });

  return Array.from(badgesByKey.values()).map(({ categories, label }) => {
    const hasApply = categories.has("apply") || categories.has("filter");
    const visualCategories: TooltipTagCategory[] = [];

    if (hasApply) {
      visualCategories.push("apply");
    }

    if (categories.has("refresh") && !hasApply) {
      visualCategories.push("refresh");
    }

    if (categories.has("synergy")) {
      visualCategories.push("synergy");
    }

    return {
      categories: visualCategories,
      label,
    };
  });
}
