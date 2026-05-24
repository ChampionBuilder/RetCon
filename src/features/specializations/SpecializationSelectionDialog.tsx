import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import type { SpecializationTree } from "@/types/character";
import {
  canDecrementSpecialization,
  canIncrementSpecialization,
  getSpecializationTreePoints,
  getSpecializationTreeIcon,
  specializationPointMax,
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
  const totalPoints = getSpecializationTreePoints(points);

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select specialization"
      className="specialization-selection-dialog"
      closeAriaLabel="Close specialization selection"
      menuChildren={
        <>
          <button
            className="tab-button"
            type="button"
            onClick={() => onClearSlot(slotIndex)}
          >
            Clear
          </button>
          <div className="specialization-dialog__title">
            <strong>{tree ? `${tree.name} Tree` : "Specialization"}</strong>
          </div>
        </>
      }
      onClose={onClose}
    >
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
          <div
            aria-label={`Specialization points: ${totalPoints} of ${specializationPointMax}`}
            className="specialization-role-points"
            title="Specialization point budget"
          >
            <span>Points</span>
            <span className="specialization-role-points__value">
              {`${totalPoints}/${specializationPointMax}`}
            </span>
          </div>
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
    </AnchoredSelectionDialog>
  );
}
