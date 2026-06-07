import type { PowerTooltipData } from "@/shared/utils/powerTooltip";
import { TooltipTags } from "@/shared/ui/TooltipTags";

type PowerTooltipProps = {
  advantageHighlightQueries?: string[];
  tooltip: PowerTooltipData;
  showAdvantages?: boolean;
};

export function PowerTooltip({
  advantageHighlightQueries = [],
  tooltip,
  showAdvantages = false,
}: PowerTooltipProps) {
  const typeLine = [tooltip.powerType, tooltip.activationType]
    .filter(Boolean)
    .join(" - ");
  const headerMeta = [tooltip.framework, tooltip.tier].filter(Boolean).join(" - ");
  const advantages = tooltip.advantages ?? [];
  const hasStructuredContent =
    headerMeta ||
    typeLine ||
    tooltip.metrics.length > 0 ||
    tooltip.rangeTags.length > 0 ||
    tooltip.tags.length > 0 ||
    tooltip.effects.length > 0;

  if (!hasStructuredContent && tooltip.fallbackText) {
    return <>{tooltip.fallbackText}</>;
  }

  const normalizedAdvantageHighlightQueries = advantageHighlightQueries
    .map((query) => query.trim().toLowerCase())
    .filter(Boolean);
  const isAdvantageHighlighted = (advantage: (typeof advantages)[number]) => {
    if (normalizedAdvantageHighlightQueries.length === 0) {
      return false;
    }

    const searchableText = [
      advantage.name,
      advantage.tooltip,
      advantage.tags.join(" "),
      advantage.damageTypes.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return normalizedAdvantageHighlightQueries.some((query) =>
      searchableText.includes(query),
    );
  };

  return (
    <div className="power-tooltip-shell">
      <div className="power-tooltip">
        <div className="power-tooltip__header">
          <strong>{tooltip.title}</strong>
          {headerMeta && <span>{headerMeta}</span>}
        </div>

        {(typeLine ||
          tooltip.metrics.length > 0 ||
          tooltip.tags.length > 0 ||
          tooltip.rangeTags.length > 0) && (
          <div className="power-tooltip__meta">
            {typeLine && <strong>{typeLine}</strong>}

            <TooltipTags tags={tooltip.tags} />

            <div className="power-tooltip__details">
              <div className="power-tooltip__metrics">
                {tooltip.metrics.map((metric) => (
                  <span key={metric}>{metric}</span>
                ))}
              </div>

              <div className="power-tooltip__range">
                {tooltip.rangeTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tooltip.effects.length > 0 && (
          <ul className="power-tooltip__effects">
            {tooltip.effects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        )}

        {!showAdvantages && advantages.length > 0 ? (
          <div className="power-tooltip__hint">
            Hold Shift to see advantages, and use mouse wheel to scroll
          </div>
        ) : null}
      </div>

      {showAdvantages && advantages.length > 0 ? (
        <aside className="power-tooltip-advantages">
          <strong className="power-tooltip-advantages__title">Advantages</strong>
          <div className="power-tooltip-advantages__list">
            {advantages.map((advantage) => (
              <section
                className={
                  isAdvantageHighlighted(advantage)
                    ? "power-tooltip-advantages__item power-tooltip-advantages__item--highlighted"
                    : "power-tooltip-advantages__item"
                }
                key={advantage.id}
              >
                <div className="power-tooltip-advantages__header">
                  <strong>{advantage.name}</strong>
                  {advantage.pointsCost !== null ? (
                    <span>{advantage.pointsCost} pt</span>
                  ) : null}
                </div>
                <TooltipTags tags={advantage.tags} />
                {advantage.tooltip ? <p>{advantage.tooltip}</p> : null}
              </section>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
