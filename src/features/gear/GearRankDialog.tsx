import type {
  GearBuildSlot,
  GearBonus,
  GearMod,
  GearModRank,
} from "@/types/gear";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { formatGearModRankTooltipText } from "./gearModTooltips";

type GearRankDialogProps = {
  anchor: DialogAnchor;
  gearSlot: GearBuildSlot;
  modSlotIndex: number;
  onClose: () => void;
  onSelectRank: (
    slotId: string,
    modSlotIndex: number,
    rank: GearModRank | null,
  ) => void;
};

const modRanks = [5, 7, 9] satisfies GearModRank[];

function getRankValue(mod: GearMod, rank: GearModRank) {
  return (
    mod.bonuses
      .map((bonus: GearBonus) => bonus.values_by_rank?.[String(rank)] ?? null)
      .filter((value) => value !== null)
      .join(" / ") || null
  );
}

function getAvailableRanks(mod: GearMod) {
  return modRanks.filter((rank) => getRankValue(mod, rank) !== null);
}

function getGearMaxRank(gearSlot: GearBuildSlot) {
  const maxRank = Number(gearSlot.gear?.max_rank);

  return Number.isNaN(maxRank) ? null : maxRank;
}

function getAllowedRanks(mod: GearMod, gearSlot: GearBuildSlot) {
  const availableRanks = getAvailableRanks(mod);
  const maxRank = getGearMaxRank(gearSlot);

  return maxRank === null
    ? availableRanks
    : availableRanks.filter((rank) => rank <= maxRank);
}

export function GearRankDialog({
  anchor,
  gearSlot,
  modSlotIndex,
  onClose,
  onSelectRank,
}: GearRankDialogProps) {
  const selectedMod = gearSlot.selectedMods[modSlotIndex] ?? null;

  if (!selectedMod) {
    return null;
  }

  const allowedRanks = getAllowedRanks(selectedMod.mod, gearSlot);

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select mod rank"
      className="power-selection-dialog gear-rank-dialog"
      closeAriaLabel="Close mod rank selection"
      menuChildren={
        <span className="power-selection-dialog__framework-title">
          {selectedMod.mod.name}
        </span>
      }
      onClose={onClose}
    >
      <div className="gear-rank-dialog__body">
        <span
          className="gear-rank-dialog__mod-name"
          data-text-tooltip={selectedMod.mod.name}
        >
          {selectedMod.mod.name}
        </span>
        {allowedRanks.map((rank) => {
          const isCurrent = selectedMod.rank === rank;

          return (
            <button
              className={[
                "gear-rank-dialog__rank-button",
                `gear-rank-dialog__rank-button--rank-${rank}`,
                isCurrent ? "gear-rank-dialog__rank-button--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={rank}
              data-text-tooltip={formatGearModRankTooltipText(
                selectedMod.mod,
                rank,
              )}
              type="button"
              onClick={() => onSelectRank(gearSlot.id, modSlotIndex, rank)}
            >
              R{rank}
            </button>
          );
        })}
      </div>
    </AnchoredSelectionDialog>
  );
}
