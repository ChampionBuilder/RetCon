import type { PowerTooltipData } from "@/shared/utils/powerTooltip";

type PowerTooltipProps = {
  tooltip: PowerTooltipData;
  showAdvantages?: boolean;
};

export function PowerTooltip({
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

            {tooltip.tags.length > 0 && (
              <div className="power-tooltip__tags">
                {tooltip.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

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
      </div>

      {showAdvantages && advantages.length > 0 ? (
        <aside className="power-tooltip-advantages">
          <strong className="power-tooltip-advantages__title">Advantages</strong>
          <div className="power-tooltip-advantages__list">
            {advantages.map((advantage) => (
              <section
                className="power-tooltip-advantages__item"
                key={advantage.id}
              >
                <div className="power-tooltip-advantages__header">
                  <strong>{advantage.name}</strong>
                  {advantage.pointsCost !== null ? (
                    <span>{advantage.pointsCost} pt</span>
                  ) : null}
                </div>
                {advantage.tooltip ? <p>{advantage.tooltip}</p> : null}
                {advantage.tags.length > 0 ? (
                  <div className="power-tooltip__tags">
                    {advantage.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
