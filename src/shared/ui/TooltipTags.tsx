type TooltipTagsProps = {
  className?: string;
  tags: string[];
};

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
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}
