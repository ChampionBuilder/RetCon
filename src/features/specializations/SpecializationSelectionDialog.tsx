import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";
import { AnchoredDialog } from "@/shared/ui/AnchoredDialog";
import type { SpecializationTree } from "@/types/character";
import {
  canDecrementSpecialization,
  canIncrementSpecialization,
  getSpecializationTreeIcon,
  type SpecializationSlotIndex,
  type SpecializationTreePoints,
} from "./specializations";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type SpecializationSelectionDialogProps = {
  anchor: DialogAnchor;
  points: SpecializationTreePoints;
  selectedRoleTreeIds: number[];
  slotIndex: SpecializationSlotIndex;
  tree: SpecializationTree | null;
  trees: SpecializationTree[];
  canChangeTree: boolean;
  onChangeSpecializationPoints: (
    slotIndex: SpecializationSlotIndex,
    specializationIndex: number,
    delta: 1 | -1,
  ) => void;
  onClearSlot: (slotIndex: SpecializationSlotIndex) => void;
  onClose: () => void;
  onSelectTree: (slotIndex: number, treeId: number) => void;
};

export function SpecializationSelectionDialog({
  anchor,
  points,
  selectedRoleTreeIds,
  slotIndex,
  tree,
  trees,
  canChangeTree,
  onChangeSpecializationPoints,
  onClearSlot,
  onClose,
  onSelectTree,
}: SpecializationSelectionDialogProps) {
  const roleTrees = trees.filter((candidateTree) => candidateTree.id >= 9);

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select specialization"
      className="selection-dialog specialization-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onClearSlot(slotIndex)}
        >
          Clear
        </button>
        <button
          aria-label="Close specialization selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >X</button>
      </div>

      {slotIndex > 0 && canChangeTree ? (
        <div className="specialization-role-picker">
          {roleTrees.map((roleTree) => {
            const isCurrent = tree?.id === roleTree.id;
            const isTaken =
              !isCurrent &&
              selectedRoleTreeIds.some((treeId) => treeId === roleTree.id);

            return (
              <button
                className={[
                  "specialization-role-choice",
                  isCurrent ? "specialization-role-choice--current" : "",
                  isTaken ? "specialization-role-choice--taken" : "",
                  roleTree.name === "Commander"
                    ? "specialization-role-choice--commander"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={roleTree.id}
                title={roleTree.tip}
                type="button"
                onClick={() => onSelectTree(slotIndex, roleTree.id)}
              >
                <SpriteIcon name={getSpecializationTreeIcon(roleTree)} size={24} />
                <span>{roleTree.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {tree ? (
        <div className="specialization-dialog-option-list">
          {tree.specializationList.slice(0, -1).map((specialization) => {
            const pointCount = points[specialization.id] ?? 0;
            const canAdd = canIncrementSpecialization(
              tree,
              points,
              specialization.id,
            );
            const canRemove = canDecrementSpecialization(
              points,
              specialization.id,
            );

            return (
              <div
                className={[
                  "specialization-option specialization-option--editable",
                  pointCount > 0 ? "specialization-option--selected" : "",
                  !canAdd && pointCount === 0
                    ? "specialization-option--locked"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={specialization.id}
                title={specialization.tip}
              >
                <SpriteIcon name={specialization.icon} size={24} />
                <span>{specialization.name}</span>
                <div
                  className="specialization-point-controls"
                  data-no-instant-tooltip
                >
                  <button
                    aria-label={`Remove point from ${specialization.name}`}
                    disabled={!canRemove}
                    type="button"
                    onClick={() =>
                      onChangeSpecializationPoints(
                        slotIndex,
                        specialization.id,
                        -1,
                      )
                    }
                  >
                    -
                  </button>
                  <small>{`${pointCount}/${specialization.maxPoints}`}</small>
                  <button
                    aria-label={`Add point to ${specialization.name}`}
                    disabled={!canAdd}
                    type="button"
                    onClick={() =>
                      onChangeSpecializationPoints(
                        slotIndex,
                        specialization.id,
                        1,
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="specialization-dialog-empty">
          Select a specialization tree first
        </p>
      )}
    </AnchoredDialog>
  );
}
