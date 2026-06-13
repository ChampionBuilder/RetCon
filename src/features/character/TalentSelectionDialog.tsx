import { useMemo } from "react";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import type { SuperStat, Talent } from "@/types/character";
import { getSelectedStatKeys } from "@/utils/innateTalents";
import { getSortedTalents, getTalentStatEntries } from "@/utils/talents";

type TalentSelectionDialogProps = {
  anchor: DialogAnchor;
  selectedSuperStats: (SuperStat | null)[];
  selectedTalentIds: number[];
  slotIndex: number;
  talents: Talent[];
  onClose: () => void;
  onSelectTalent: (slotIndex: number, talentId: number) => void;
};

export function TalentSelectionDialog({
  anchor,
  selectedSuperStats,
  selectedTalentIds,
  slotIndex,
  talents,
  onClose,
  onSelectTalent,
}: TalentSelectionDialogProps) {
  const selectedStatKeys = useMemo(() => {
    return getSelectedStatKeys(selectedSuperStats);
  }, [selectedSuperStats]);
  const selectedTalentId = selectedTalentIds[slotIndex] ?? 0;
  const selectableTalents = useMemo(() => {
    return getSortedTalents(talents, selectedStatKeys, true);
  }, [selectedStatKeys, talents]);

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select talent"
      className="talent-selection-dialog"
      closeAriaLabel="Close talent selection"
      menuChildren={
        <button
          className="tab-button"
          type="button"
          onClick={() => onSelectTalent(slotIndex, 0)}
        >
          Clear
        </button>
      }
      onClose={onClose}
    >
      <div className="talent-choice-grid">
        {selectableTalents.map((talent) => {
          const isCurrent = selectedTalentId === talent.id;
          const isTaken =
            !isCurrent &&
            selectedTalentIds.some((talentId) => talentId === talent.id);
          const stats = getTalentStatEntries(talent, selectedStatKeys);
          const isDenseStatLine = talent.name === "Jack of All Trades";

          return (
            <button
              className={[
                "talent-choice",
                isCurrent ? "talent-choice--current" : "",
                isTaken ? "talent-choice--taken" : "",
                isDenseStatLine ? "talent-choice--dense" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={talent.id}
              type="button"
              onClick={() => onSelectTalent(slotIndex, talent.id)}
            >
              <span>{talent.name}</span>
              <small>
                {stats.map((stat, index) => (
                  <span key={stat.key}>
                    {index > 0 ? ", " : ""}
                    {stat.matchesSelectedStat ? (
                      <strong>{`${stat.label}: ${stat.value}`}</strong>
                    ) : (
                      `${stat.label}: ${stat.value}`
                    )}
                  </span>
                ))}
              </small>
            </button>
          );
        })}
      </div>
    </AnchoredSelectionDialog>
  );
}
