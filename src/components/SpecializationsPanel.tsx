import type { MouseEvent } from "react";
import type { DialogAnchor } from "./AnchoredDialog";
import type { SpecializationTree } from "../types/character";
import {
  getSpecializationTreePoints,
  getTreeMastery,
  specializationPointMax,
  type SpecializationSlotIndex,
  type SpecializationTreePoints,
} from "../utils/specializations";
import { SpriteIcon } from "./SpriteIcon";

type SpecializationsPanelProps = {
  masterySlot: number | null;
  pointsBySlot: SpecializationTreePoints[];
  trees: (SpecializationTree | null)[];
  onOpenSpecialization: (
    slotIndex: SpecializationSlotIndex,
    anchor: DialogAnchor,
  ) => void;
  onSelectMastery: (anchor: DialogAnchor) => void;
};

const slotLabels = ["Stat Tree", "Role Tree 1", "Role Tree 2"];
const displayedSlotIndexes: SpecializationSlotIndex[] = [2, 1, 0];

export function SpecializationsPanel({
  masterySlot,
  pointsBySlot,
  trees,
  onOpenSpecialization,
  onSelectMastery,
}: SpecializationsPanelProps) {
  const masteryTree = masterySlot === null ? null : trees[masterySlot];
  const mastery = getTreeMastery(masteryTree);

  return (
    <aside className="panel specializations-panel">
      <h2>Specializations</h2>

      <div className="specialization-list">
        <section
          className={[
            "specialization-tree specialization-tree--mastery",
            !mastery ? "specialization-tree--empty" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            className="specialization-tree__header"
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              onSelectMastery({
                x: event.clientX,
                y: event.clientY,
              })
            }
          >
            <span>{mastery ? `${masteryTree?.name} Mastery` : "Mastery"}</span>
            <small>{mastery ? "(1/1)" : "(0/1)"}</small>
          </button>

          {mastery ? (
            <div className="specialization-option specialization-option--selected">
              <SpriteIcon name={mastery.icon} size={24} />
              <span>{mastery.name}</span>
              <small>1/1</small>
            </div>
          ) : (
            <p className="specialization-tree__empty-copy">
              Choose a mastery
            </p>
          )}
        </section>

        {displayedSlotIndexes.map((slotIndex) => {
          const tree = trees[slotIndex];
          const points = pointsBySlot[slotIndex] ?? [];
          const totalPoints = getSpecializationTreePoints(points);

          return (
            <section
              className={[
                "specialization-tree",
                !tree ? "specialization-tree--empty" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={slotIndex}
            >
              <button
                className="specialization-tree__header"
                title={tree?.tip ?? slotLabels[slotIndex]}
                type="button"
                onClick={(event: MouseEvent<HTMLButtonElement>) =>
                  onOpenSpecialization(slotIndex, {
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
              >
                <span>{tree ? `${tree.name} Tree` : slotLabels[slotIndex]}</span>
                <small>{`(${totalPoints}/${specializationPointMax})`}</small>
              </button>

              {tree ? (
                <div className="specialization-option-list">
                  {tree.specializationList
                    .slice(0, -1)
                    .flatMap((specialization) => {
                      const pointCount = points[specialization.id] ?? 0;

                      if (pointCount <= 0) {
                        return [];
                      }

                      return (
                        <div
                          className="specialization-option specialization-option--selected"
                          key={specialization.id}
                          title={specialization.tip}
                        >
                          <SpriteIcon name={specialization.icon} size={24} />
                          <span>{specialization.name}</span>
                          <small>{`${pointCount}/${specialization.maxPoints}`}</small>
                        </div>
                      );
                    })}
                  {totalPoints === 0 ? (
                    <p className="specialization-tree__empty-copy">
                      No specializations selected
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="specialization-tree__empty-copy">
                  {slotIndex === 0
                    ? "Select a primary superstat"
                    : "Select a role tree"}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
