import { useMemo } from "react";
import type { DialogAnchor } from "./AnchoredDialog";
import { AnchoredDialog } from "./AnchoredDialog";
import { usePersistentBoolean } from "../hooks/usePersistentBoolean";
import type { SuperStat, Talent } from "../types/character";
import { getSelectedStatKeys } from "../utils/innateTalents";
import {
  getSortedTalents,
  getTalentStatEntries,
  getTalentTip,
} from "../utils/talents";

type TalentSelectionDialogProps = {
  anchor: DialogAnchor;
  selectedSuperStats: (SuperStat | null)[];
  selectedTalentIds: number[];
  slotIndex: number;
  talents: Talent[];
  onClose: () => void;
  onAutofillTalents: () => void;
  onSelectTalent: (slotIndex: number, talentId: number) => void;
};

export function TalentSelectionDialog({
  anchor,
  selectedSuperStats,
  selectedTalentIds,
  slotIndex,
  talents,
  onClose,
  onAutofillTalents,
  onSelectTalent,
}: TalentSelectionDialogProps) {
  const [sortBySelectedStats, setSortBySelectedStats] = usePersistentBoolean(
    "retcon.sortMatches.talents",
  );
  const selectedStatKeys = useMemo(() => {
    return getSelectedStatKeys(selectedSuperStats);
  }, [selectedSuperStats]);
  const selectedTalentId = selectedTalentIds[slotIndex] ?? 0;
  const selectableTalents = useMemo(() => {
    return getSortedTalents(talents, selectedStatKeys, sortBySelectedStats);
  }, [selectedStatKeys, sortBySelectedStats, talents]);

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select talent"
      className="selection-dialog talent-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onSelectTalent(slotIndex, 0)}
        >
          Clear
        </button>
        <button
          className="tab-button"
          type="button"
          onClick={onAutofillTalents}
        >
          Autofill
        </button>
        <button
          className={
            sortBySelectedStats ? "tab-button tab-button--active" : "tab-button"
          }
          title="Sort talents by matching selected super stats"
          type="button"
          onClick={() =>
            setSortBySelectedStats(
              (currentSortBySelectedStats) => !currentSortBySelectedStats,
            )
          }
        >
          Sort Matches
        </button>
        <button
          aria-label="Close talent selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="talent-choice-grid">
        {selectableTalents.map((talent) => {
          const isCurrent = selectedTalentId === talent.id;
          const isTaken =
            !isCurrent &&
            selectedTalentIds.some((talentId) => talentId === talent.id);
          const stats = getTalentStatEntries(talent, selectedStatKeys);

          return (
            <button
              className={[
                "talent-choice",
                isCurrent ? "talent-choice--current" : "",
                isTaken ? "talent-choice--taken" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={talent.id}
              title={getTalentTip(talent)}
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
    </AnchoredDialog>
  );
}
