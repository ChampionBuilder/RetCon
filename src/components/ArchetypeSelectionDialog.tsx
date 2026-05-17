import { useState } from "react";
import type {
  Archetype,
  ArchetypeGroup,
  ArchetypeUnlock,
} from "../types/character";
import type { DialogAnchor } from "./AnchoredDialog";
import { AnchoredDialog } from "./AnchoredDialog";
import { SpriteIcon } from "./SpriteIcon";

type ArchetypeSelectionDialogProps = {
  anchor: DialogAnchor;
  archetypes: Archetype[];
  groups: ArchetypeGroup[];
  selectedArchetypeId: number;
  unlocks: ArchetypeUnlock[];
  onClose: () => void;
  onSelectArchetype: (archetypeId: number) => void;
};

function getUnlockText(
  archetype: Archetype,
  unlocks: ArchetypeUnlock[],
) {
  const unlockType = Array.isArray(archetype.unlockType)
    ? archetype.unlockType[0]
    : archetype.unlockType;

  return unlocks.find((unlock) => unlock.id === unlockType)?.info ?? null;
}

const archetypeGroupSortOrder = new Map<number, number>([
  [5, 0], // Ranged Damage
  [3, 1], // Tank
  [4, 2], // Melee Damage
  [2, 3], // Hybrid
  [6, 4], // Support
]);

export function ArchetypeSelectionDialog({
  anchor,
  archetypes,
  groups,
  selectedArchetypeId,
  unlocks,
  onClose,
  onSelectArchetype,
}: ArchetypeSelectionDialogProps) {
  const selectableArchetypes = archetypes
    .filter((archetype) => archetype.id > 0)
    .sort((a, b) => {
      if (a.id === 1 || b.id === 1) {
        return a.id === 1 ? -1 : 1;
      }

      const groupOrderDifference =
        (archetypeGroupSortOrder.get(a.group) ?? Number.MAX_SAFE_INTEGER) -
        (archetypeGroupSortOrder.get(b.group) ?? Number.MAX_SAFE_INTEGER);

      return groupOrderDifference || (a.name ?? "").localeCompare(b.name ?? "");
    });
  const [focusedArchetypeId, setFocusedArchetypeId] = useState(
    selectedArchetypeId,
  );
  const focusedArchetype =
    selectableArchetypes.find(
      (archetype) => archetype.id === focusedArchetypeId,
    ) ??
    selectableArchetypes.find(
      (archetype) => archetype.id === selectedArchetypeId,
    ) ??
    selectableArchetypes[0] ??
    null;
  const focusedGroup = groups.find(
    (group) => group.id === focusedArchetype?.group,
  );
  const focusedUnlockText = focusedArchetype
    ? getUnlockText(focusedArchetype, unlocks)
    : null;

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select archetype"
      className="selection-dialog archetype-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <strong>Archetypes</strong>
        <button
          aria-label="Close archetype selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="archetype-selection-layout">
        <div className="archetype-selection-list">
          {selectableArchetypes.map((archetype) => {
            const group = groups.find(
              (candidateGroup) => candidateGroup.id === archetype.group,
            );
            const unlockText = getUnlockText(archetype, unlocks);
            const isCurrent = archetype.id === selectedArchetypeId;
            const isFocused = archetype.id === focusedArchetype?.id;

            return (
              <button
                className={[
                  "archetype-selection-choice",
                  isCurrent ? "archetype-selection-choice--current" : "",
                  isFocused ? "archetype-selection-choice--focused" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={archetype.id}
                title={[group?.name, unlockText].filter(Boolean).join(" / ")}
                type="button"
                onFocus={() => setFocusedArchetypeId(archetype.id)}
                onMouseEnter={() => setFocusedArchetypeId(archetype.id)}
                onClick={() => onSelectArchetype(archetype.id)}
              >
                <SpriteIcon name={archetype.icon} size={28} />
                <span>{archetype.name}</span>
                <small>{group?.name ?? ""}</small>
              </button>
            );
          })}
        </div>

        {focusedArchetype ? (
          <aside className="archetype-selection-details">
            <div className="archetype-selection-details__header">
              <SpriteIcon name={focusedArchetype.icon} size={36} />
              <div>
                <strong>{focusedArchetype.name}</strong>
                <small>
                  {[focusedGroup?.name, focusedUnlockText]
                    .filter(Boolean)
                    .join(" / ")}
                </small>
              </div>
            </div>

            {focusedArchetype.overview ? (
              <p>{focusedArchetype.overview}</p>
            ) : null}

            {focusedArchetype.concepts ? (
              <section>
                <h3>Concepts</h3>
                <p>{focusedArchetype.concepts}</p>
              </section>
            ) : null}

            {focusedArchetype.extra ? (
              <section>
                <h3>Playstyle</h3>
                <p>{focusedArchetype.extra}</p>
              </section>
            ) : null}
          </aside>
        ) : null}
      </div>
    </AnchoredDialog>
  );
}
