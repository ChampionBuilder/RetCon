import { useId, useState, type MouseEvent } from "react";
import type {
  Archetype,
  ArchetypeGroup,
  ArchetypeUnlock,
} from "@/types/character";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { isAltActionClick } from "@/shared/utils/mouseShortcuts";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

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
  const unlockTypes = Array.isArray(archetype.unlockType)
    ? archetype.unlockType
    : [archetype.unlockType];

  const unlockLabels = unlockTypes
    .map((unlockType) => unlocks.find((unlock) => unlock.id === unlockType)?.info)
    .filter(Boolean);

  return unlockLabels.length > 0 ? unlockLabels.join(", ") : null;
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
  const roleSectionId = useId();
  const [closedRoleIds, setClosedRoleIds] = useState<Set<number>>(new Set());
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
  const freeformArchetype = selectableArchetypes.find(
    (archetype) => archetype.id === 1,
  );
  const archetypesByRole = new Map<number, Archetype[]>();

  selectableArchetypes.forEach((archetype) => {
    if (archetype.id === 1) {
      return;
    }

    const roleArchetypes = archetypesByRole.get(archetype.group) ?? [];
    roleArchetypes.push(archetype);
    archetypesByRole.set(archetype.group, roleArchetypes);
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

  function toggleRoleSection(
    roleId: number,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (isAltActionClick(event)) {
      setClosedRoleIds(
        closedRoleIds.has(roleId)
          ? new Set()
          : new Set(archetypesByRole.keys()),
      );
      return;
    }

    setClosedRoleIds((previous) => {
      const next = new Set(previous);

      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }

      return next;
    });
  }

  function renderArchetypeChoice(archetype: Archetype) {
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
      </button>
    );
  }

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select archetype"
      className="archetype-selection-dialog"
      closeAriaLabel="Close archetype selection"
      menuChildren={<strong>Archetypes</strong>}
      onClose={onClose}
    >
      <div className="archetype-selection-layout">
        <div className="archetype-selection-list">
          {freeformArchetype ? (
            <div className="archetype-selection-grid">
              {renderArchetypeChoice(freeformArchetype)}
            </div>
          ) : null}
          {Array.from(archetypesByRole, ([roleId, roleArchetypes]) => {
            const group = groups.find(
              (candidateGroup) => candidateGroup.id === roleId,
            );
            const isClosed = closedRoleIds.has(roleId);
            const contentId = `${roleSectionId}-${roleId}`;

            return (
              <section className="archetype-selection-group" key={roleId}>
                <button
                  className="archetype-selection-group__toggle"
                  aria-controls={contentId}
                  aria-expanded={!isClosed}
                  type="button"
                  onClick={(event) => toggleRoleSection(roleId, event)}
                >
                  <span>{group?.name ?? "Other"}</span>
                  <span
                    aria-hidden="true"
                    className={
                      isClosed
                        ? "tier-toggle-icon tier-toggle-icon--closed"
                        : "tier-toggle-icon"
                    }
                  />
                </button>
                <div
                  className="archetype-selection-grid"
                  hidden={isClosed}
                  id={contentId}
                >
                  {roleArchetypes.map(renderArchetypeChoice)}
                </div>
              </section>
            );
          })}
        </div>

        {focusedArchetype ? (
          <aside className="archetype-selection-details">
            <div className="archetype-selection-details__header">
              <SpriteIcon name={focusedArchetype.icon} size={36} />
              <div>
                <strong>{focusedArchetype.name}</strong>
                <small>{focusedGroup?.name ?? ""}</small>
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

            {focusedUnlockText ? (
              <div className="archetype-selection-details__source">
                <strong>Source:</strong>
                <span>{focusedUnlockText}</span>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </AnchoredSelectionDialog>
  );
}
