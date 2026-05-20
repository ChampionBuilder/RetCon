import type { SuperStat } from "../types/character";
import { getStatIconName } from "../utils/icons";
import { AnchoredDialog, type DialogAnchor } from "./AnchoredDialog";
import { SpriteIcon } from "./SpriteIcon";

type StatSelectionDialogProps = {
  anchor: DialogAnchor;
  stats: SuperStat[];
  selectedStatIds: number[];
  slotIndex: number;
  onSelectStat: (slotIndex: number, statId: number) => void;
  onClose: () => void;
};

function getStatTip(stat: SuperStat) {
  const lines = [stat.info];

  if (stat.forms?.length) {
    lines.push(`Forms: ${stat.forms.join(", ")}`);
  }

  if (stat.primaryEUs?.length) {
    lines.push(`Energy Unlocks (Main Bonus): ${stat.primaryEUs.join(", ")}`);
  }

  if (stat.secondaryEUs?.length) {
    lines.push(
      `Energy Unlocks (Lesser Bonus): ${stat.secondaryEUs.join(", ")}`,
    );
  }

  return lines.filter(Boolean).join("\n\n");
}

export function StatSelectionDialog({
  anchor,
  stats,
  selectedStatIds,
  slotIndex,
  onSelectStat,
  onClose,
}: StatSelectionDialogProps) {
  const currentStatId = selectedStatIds[slotIndex] ?? 0;
  const selectableStats = stats.filter((stat) => stat.id > 0);

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select super stat"
      className="selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onSelectStat(slotIndex, 0)}
        >
          Clear
        </button>
        <button
          aria-label="Close super stat selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >X</button>
      </div>

      <div className="stat-choice-grid">
        {selectableStats.map((stat) => {
          const isCurrent = currentStatId === stat.id;
          const isTaken =
            !isCurrent && selectedStatIds.some((statId) => statId === stat.id);

          return (
            <button
              className={[
                "stat-choice",
                isCurrent ? "stat-choice--current" : "",
                isTaken ? "stat-choice--taken" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={stat.id}
              title={getStatTip(stat)}
              type="button"
              onClick={() => onSelectStat(slotIndex, stat.id)}
            >
              <SpriteIcon name={getStatIconName(stat.name)} size={28} />
              <span>{stat.name}</span>
            </button>
          );
        })}
      </div>
    </AnchoredDialog>
  );
}
