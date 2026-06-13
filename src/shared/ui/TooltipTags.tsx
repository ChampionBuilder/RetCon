import type { TooltipTagBadge } from "@/utils/powerTags";

type TooltipTag = string | TooltipTagBadge;

type TooltipTagsProps = {
  className?: string;
  tags: TooltipTag[];
};

function getTagLabel(tag: TooltipTag) {
  return typeof tag === "string" ? tag : tag.label;
}

function getTagClassName(tag: TooltipTag) {
  if (typeof tag === "string" || tag.categories.length === 0) {
    return undefined;
  }

  return [
    "tooltip-tag",
    ...tag.categories.map((category) => `tooltip-tag--${category}`),
  ].join(" ");
}

export function TooltipTags({
  className = "power-tooltip__tags",
  tags,
}: TooltipTagsProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {tags.map((tag) => (
        <span className={getTagClassName(tag)} key={getTagLabel(tag)}>
          {getTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}
