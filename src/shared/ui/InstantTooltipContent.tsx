import { PowerTooltip } from "@/shared/ui/PowerTooltip";
import { TooltipTags } from "@/shared/ui/TooltipTags";
import type {
  AdvantageTooltipData,
  StatTooltipData,
  TooltipContent,
} from "@/shared/ui/instantTooltipTypes";
import type { FrameworkGlossaryTooltip } from "@/utils/frameworkGlossary";

function StatTooltip({ data }: { data: StatTooltipData }) {
  return (
    <div className="stat-tooltip">
      {data.info ? (
        <p className="stat-tooltip__intro">
          <strong>{data.info}</strong>
        </p>
      ) : null}
      {data.forms.length > 0 ? (
        <div className="stat-tooltip__section">
          <strong>Toggle</strong>
          <span>{data.forms.join(", ")}</span>
        </div>
      ) : null}
      {data.primaryEUs.length > 0 ? (
        <div className="stat-tooltip__section">
          <strong>Primary</strong>
          <span>{data.primaryEUs.join(", ")}</span>
        </div>
      ) : null}
      {data.secondaryEUs.length > 0 ? (
        <div className="stat-tooltip__section">
          <strong>Secondary</strong>
          <span>{data.secondaryEUs.join(", ")}</span>
        </div>
      ) : null}
    </div>
  );
}

function FrameworkTooltip({ data }: { data: FrameworkGlossaryTooltip }) {
  return (
    <div className="framework-tooltip">
      <div className="framework-tooltip__header">
        <strong>{data.framework}</strong>
      </div>

      {data.sections.map((section) => (
        <div className="framework-tooltip__section" key={section.label}>
          <strong>{section.label}</strong>
          <TooltipTags className="framework-tooltip__tags" tags={section.tags} />
        </div>
      ))}

      {data.hint ? (
        <div className="framework-tooltip__hint">{data.hint}</div>
      ) : null}
    </div>
  );
}

function AdvantageTooltip({ data }: { data: AdvantageTooltipData }) {
  return (
    <div className="advantage-tooltip">
      <div className="power-tooltip-advantages__header">
        <strong>{data.name}</strong>
        {data.pointsCost !== null ? <span>{data.pointsCost} pt</span> : null}
      </div>

      {data.tags.length > 0 ? <TooltipTags tags={data.tags} /> : null}

      {data.tooltip ? <p>{data.tooltip}</p> : null}
      {data.lockedReason ? (
        <p className="advantage-tooltip__warning">{data.lockedReason}</p>
      ) : null}
    </div>
  );
}

function TextTooltip({ text }: { text: string }) {
  const lines = text
    .replace(/<br\s*\/?>/giu, "\n")
    .split(/\r?\n/u);

  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  );
}

type InstantTooltipContentProps = {
  advantageHighlightQueries: string[];
  content: TooltipContent;
  showAdvancedPowerTooltip: boolean;
};

export function InstantTooltipContent({
  advantageHighlightQueries,
  content,
  showAdvancedPowerTooltip,
}: InstantTooltipContentProps) {
  if (content.kind === "power") {
    return (
      <PowerTooltip
        advantageHighlightQueries={advantageHighlightQueries}
        showAdvantages={showAdvancedPowerTooltip}
        tooltip={content.data}
      />
    );
  }

  if (content.kind === "advantage") {
    return <AdvantageTooltip data={content.data} />;
  }

  if (content.kind === "stat") {
    return <StatTooltip data={content.data} />;
  }

  if (content.kind === "framework") {
    return <FrameworkTooltip data={content.data} />;
  }

  return <TextTooltip text={content.text} />;
}
