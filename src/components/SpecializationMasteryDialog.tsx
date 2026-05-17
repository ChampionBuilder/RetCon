import type { DialogAnchor } from "./AnchoredDialog";
import { AnchoredDialog } from "./AnchoredDialog";
import type { SpecializationTree } from "../types/character";
import { getTreeMastery } from "../utils/specializations";
import { SpriteIcon } from "./SpriteIcon";

type SpecializationMasteryDialogProps = {
  anchor: DialogAnchor;
  selectedMasterySlot: number | null;
  trees: (SpecializationTree | null)[];
  onClose: () => void;
  onSelectMastery: (slotIndex: number | null) => void;
};

export function SpecializationMasteryDialog({
  anchor,
  selectedMasterySlot,
  trees,
  onClose,
  onSelectMastery,
}: SpecializationMasteryDialogProps) {
  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select specialization mastery"
      className="selection-dialog specialization-mastery-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onSelectMastery(null)}
        >
          Clear
        </button>
        <button
          aria-label="Close mastery selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="specialization-mastery-choice-grid">
        {trees.map((tree, slotIndex) => {
          const mastery = getTreeMastery(tree);
          const isCurrent = selectedMasterySlot === slotIndex;

          return (
            <button
              className={[
                "specialization-mastery-choice",
                isCurrent ? "specialization-mastery-choice--current" : "",
                !tree ? "specialization-mastery-choice--empty" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={!tree || !mastery}
              key={slotIndex}
              title={mastery?.tip}
              type="button"
              onClick={() => onSelectMastery(slotIndex)}
            >
              <SpriteIcon name={mastery?.icon ?? "Any_Generic"} size={28} />
              <span>{mastery?.name ?? `Tree ${slotIndex + 1} Mastery`}</span>
              <small>{tree?.name ?? "No tree selected"}</small>
            </button>
          );
        })}
      </div>
    </AnchoredDialog>
  );
}
