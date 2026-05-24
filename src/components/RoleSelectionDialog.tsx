import type { ArchetypeGroup } from "@/types/character";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type RoleSelectionDialogProps = {
  anchor: DialogAnchor;
  groups: ArchetypeGroup[];
  selectedRoleId: number;
  onClose: () => void;
  onSelectRole: (roleId: number) => void;
};

const selectableRoleIds = [1, 5, 3, 4, 2, 6];

export function RoleSelectionDialog({
  anchor,
  groups,
  selectedRoleId,
  onClose,
  onSelectRole,
}: RoleSelectionDialogProps) {
  const selectableGroups = selectableRoleIds
    .map((roleId) => groups.find((group) => group.id === roleId) ?? null)
    .filter((group): group is ArchetypeGroup => group !== null);

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select role"
      className="role-selection-dialog"
      closeAriaLabel="Close role selection"
      menuChildren={<strong>Role</strong>}
      onClose={onClose}
    >
      <div className="role-selection-list">
        {selectableGroups.map((group) => {
          const isCurrent = selectedRoleId === group.id;

          return (
            <button
              className={[
                "role-selection-choice",
                isCurrent ? "role-selection-choice--current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={group.id}
              title={group.toolTip ?? undefined}
              type="button"
              onClick={() => onSelectRole(group.id)}
            >
              <SpriteIcon name={group.icon ?? "Role_Freeform"} size={24} />
              <span>{group.name}</span>
            </button>
          );
        })}
      </div>
    </AnchoredSelectionDialog>
  );
}
