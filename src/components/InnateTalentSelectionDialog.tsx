import { useMemo } from "react";
import type { DialogAnchor } from "./AnchoredDialog";
import { AnchoredDialog } from "./AnchoredDialog";
import type { InnateTalent, SuperStat } from "../types/character";
import {
  countInnateTalentVisibleStats,
  countMatchingStats,
  getInnateTalentMatchPriority,
  getInnateTalentProfilePriority,
  getInnateTalentStatEntries,
  getInnateTalentTip,
  getMatchingInnateTalentStatValue,
  getSelectedStatKeys,
} from "../utils/innateTalents";

type InnateTalentSelectionDialogProps = {
  anchor: DialogAnchor;
  selectedTalentId: number;
  selectedSuperStats: (SuperStat | null)[];
  talents: InnateTalent[];
  onClose: () => void;
  onSelectTalent: (talentId: number) => void;
};

export function InnateTalentSelectionDialog({
  anchor,
  selectedTalentId,
  selectedSuperStats,
  talents,
  onClose,
  onSelectTalent,
}: InnateTalentSelectionDialogProps) {
  const selectedStatKeys = useMemo(() => {
    return getSelectedStatKeys(selectedSuperStats);
  }, [selectedSuperStats]);
  const selectableTalents = useMemo(() => {
    const talentList = talents
      .filter((talent) => talent.id > 0)
      .map((talent, index) => ({ index, talent }));

    talentList.sort((a, b) => {
      const statCountDifference =
        countInnateTalentVisibleStats(a.talent) -
        countInnateTalentVisibleStats(b.talent);

      return statCountDifference || a.index - b.index;
    });

    talentList.sort((a, b) => {
      const matchPriorityDifference =
        getInnateTalentMatchPriority(a.talent, selectedStatKeys) -
        getInnateTalentMatchPriority(b.talent, selectedStatKeys);
      const matchDifference =
        countMatchingStats(b.talent, selectedStatKeys) -
        countMatchingStats(a.talent, selectedStatKeys);
      const matchedValueDifference =
        getMatchingInnateTalentStatValue(b.talent, selectedStatKeys) -
        getMatchingInnateTalentStatValue(a.talent, selectedStatKeys);
      const profilePriorityDifference =
        getInnateTalentProfilePriority(a.talent) -
        getInnateTalentProfilePriority(b.talent);
      const statCountDifference =
        countInnateTalentVisibleStats(a.talent) -
        countInnateTalentVisibleStats(b.talent);

      return (
        matchPriorityDifference ||
        matchDifference ||
        matchedValueDifference ||
        profilePriorityDifference ||
        statCountDifference ||
        a.index - b.index
      );
    });

    return talentList.map(({ talent }) => talent);
  }, [selectedStatKeys, talents]);

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select innate talent"
      className="selection-dialog innate-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onSelectTalent(0)}
        >
          Clear
        </button>
        <button
          aria-label="Close innate talent selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="innate-choice-grid">
        {selectableTalents.map((talent) => {
          const isCurrent = selectedTalentId === talent.id;
          const stats = getInnateTalentStatEntries(talent, selectedStatKeys);

          return (
            <button
              className={[
                "innate-choice",
                isCurrent ? "innate-choice--current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={talent.id}
              title={getInnateTalentTip(talent)}
              type="button"
              onClick={() => onSelectTalent(talent.id)}
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
