import type { PowerTooltipData } from "../utils/powerTooltip";

type PowerTooltipProps = {
  tooltip: PowerTooltipData;
};

export function PowerTooltip({ tooltip }: PowerTooltipProps) {
  const hasStructuredContent =
    tooltip.framework ||
    tooltip.powerType ||
    tooltip.metrics.length > 0 ||
    tooltip.rangeTags.length > 0 ||
    tooltip.tags.length > 0 ||
    tooltip.overview.length > 0 ||
    tooltip.effects.length > 0;

  if (!hasStructuredContent && tooltip.fallbackText) {
    return <>{tooltip.fallbackText}</>;
  }

  return (
    <div className="power-tooltip">
      <div className="power-tooltip__header">
        <strong>{tooltip.title}</strong>
        {tooltip.framework && <span>{tooltip.framework}</span>}
      </div>

      {(tooltip.powerType || tooltip.metrics.length > 0) && (
        <div className="power-tooltip__meta">
          {tooltip.powerType && <strong>{tooltip.powerType}</strong>}
          {tooltip.metrics.length > 0 && (
            <span>{tooltip.metrics.join(" / ")}</span>
          )}
        </div>
      )}

      {tooltip.overview.length > 0 && (
        <div className="power-tooltip__overview">
          {tooltip.overview.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}

      {tooltip.rangeTags.length > 0 && (
        <div className="power-tooltip__range">
          {tooltip.rangeTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {tooltip.tags.length > 0 && (
        <div className="power-tooltip__tags">
          {tooltip.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {tooltip.effects.length > 0 && (
        <ul className="power-tooltip__effects">
          {tooltip.effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
