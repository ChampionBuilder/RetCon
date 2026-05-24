import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import type { SpecializationTree } from "@/types/character";
import { getTreeMastery } from "./specializations";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

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
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select specialization mastery"
      className="specialization-mastery-dialog"
      closeAriaLabel="Close mastery selection"
      menuChildren={
        <button
          className="tab-button"
          type="button"
          onClick={() => onSelectMastery(null)}
        >
          Clear
        </button>
      }
      onClose={onClose}
    >
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
    </AnchoredSelectionDialog>
  );
}
