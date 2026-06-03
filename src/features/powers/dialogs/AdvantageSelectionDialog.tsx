import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import { getRequiredAdvantage } from "@/utils/advantageDependencies";
import {
  canAddAdvantage,
  getSlotAdvantagePoints,
  maxAdvantagePointsPerPower,
} from "@/utils/advantagerules";
import {
  cleanMultilineTooltipText,
  formatTooltipLabel,
} from "@/shared/utils/tooltipText";
import { getPowerAdvantages } from "@/utils/powerAdvantages";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";

type AdvantageSelectionDialogProps = {
  anchor: DialogAnchor;
  advantagePointBudget: number;
  advantages: Advantage[];
  buildSlot: BuildSlot;
  totalAdvantagePoints: number;
  onClearAdvantages: (slotNumber: number) => void;
  onClose: () => void;
  onToggleAdvantage: (slotNumber: number, advantageId: number) => void;
};

function getAdvantageTooltipAttribute(
  advantage: Advantage,
  lockedReason: string | null,
) {
  const tooltipLockedReason =
    lockedReason === "Not enough advantage points" ? null : lockedReason;

  return JSON.stringify({
    name: advantage.name,
    pointsCost: advantage.points_cost,
    tags: (advantage.tags ?? []).map(formatTooltipLabel).filter(Boolean),
    tooltip: cleanMultilineTooltipText(advantage.tooltip),
    lockedReason: tooltipLockedReason,
  });
}

function getMissingDependency(
  advantage: Advantage,
  selectedAdvantageIds: number[],
  slotAdvantages: Advantage[],
) {
  const requiredAdvantage = getRequiredAdvantage(advantage, slotAdvantages);

  if (
    requiredAdvantage === null ||
    selectedAdvantageIds.includes(requiredAdvantage.advantage_id)
  ) {
    return null;
  }

  return requiredAdvantage;
}

function getLockedReason(
  advantage: Advantage,
  buildSlot: BuildSlot,
  slotAdvantages: Advantage[],
  totalAdvantagePoints: number,
  advantagePointBudget: number,
) {
  const missingDependency = getMissingDependency(
    advantage,
    buildSlot.selectedAdvantages,
    slotAdvantages,
  );

  if (missingDependency) {
    return `Requires ${missingDependency.name}`;
  }

  if (
    !canAddAdvantage(
      buildSlot,
      advantage,
      slotAdvantages,
      totalAdvantagePoints,
      advantagePointBudget,
    )
  ) {
    return "Not enough advantage points";
  }

  return null;
}

export function AdvantageSelectionDialog({
  anchor,
  advantagePointBudget,
  advantages,
  buildSlot,
  totalAdvantagePoints,
  onClearAdvantages,
  onClose,
  onToggleAdvantage,
}: AdvantageSelectionDialogProps) {
  const slotAdvantages = getPowerAdvantages(buildSlot.power, advantages);
  const slotPointTotal = getSlotAdvantagePoints(buildSlot, slotAdvantages);

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select advantages"
      className="advantage-selection-dialog"
      closeAriaLabel="Close advantage selection"
      menuChildren={
        <>
          <button
            className="tab-button"
            type="button"
            onClick={() => onClearAdvantages(buildSlot.slot)}
          >
            Clear
          </button>
          <span className="advantage-selection-dialog__points">
            {slotPointTotal}/{maxAdvantagePointsPerPower}
          </span>
        </>
      }
      onClose={onClose}
    >
      <div className="advantage-selection-list">
        {slotAdvantages.map((advantage) => {
          const isSelected = buildSlot.selectedAdvantages.includes(
            advantage.advantage_id,
          );
          const lockedReason = isSelected
            ? null
            : getLockedReason(
                advantage,
                buildSlot,
                slotAdvantages,
                totalAdvantagePoints,
                advantagePointBudget,
              );
          return (
            <button
              aria-disabled={lockedReason ? true : undefined}
              className={[
                "advantage-selection-choice",
                isSelected ? "advantage-selection-choice--selected" : "",
                lockedReason ? "advantage-selection-choice--locked" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-advantage-tooltip={getAdvantageTooltipAttribute(
                advantage,
                lockedReason,
              )}
              key={advantage.advantage_id}
              type="button"
              onClick={() => {
                if (lockedReason) {
                  return;
                }

                onToggleAdvantage(buildSlot.slot, advantage.advantage_id);
              }}
            >
              <span>{advantage.name}</span>
              <small>{advantage.points_cost ?? 0} pts</small>
            </button>
          );
        })}
      </div>
    </AnchoredSelectionDialog>
  );
}
