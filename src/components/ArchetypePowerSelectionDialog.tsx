import type { Power } from "@/types/powers";
import { getPowerIconName } from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type ArchetypePowerSelectionDialogProps = {
  anchor: DialogAnchor;
  currentPowerId: number | null;
  powers: Power[];
  slotNumber: number;
  onClose: () => void;
  onSelectPower: (slotNumber: number, powerId: number) => void;
};

export function ArchetypePowerSelectionDialog({
  anchor,
  currentPowerId,
  powers,
  slotNumber,
  onClose,
  onSelectPower,
}: ArchetypePowerSelectionDialogProps) {
  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select archetype power"
      className="archetype-power-selection-dialog"
      closeAriaLabel="Close archetype power selection"
      menuChildren={<strong>Power choice</strong>}
      onClose={onClose}
    >
      <div className="archetype-power-selection-list">
        {powers.map((power) => {
          const isCurrent = currentPowerId === power.power_id;

          return (
            <button
              className={[
                "archetype-power-selection-choice",
                isCurrent ? "archetype-power-selection-choice--current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={power.power_id}
              data-power-tooltip={getPowerTooltipAttribute(power)}
              title={getPowerTooltipText(power)}
              type="button"
              onClick={() => onSelectPower(slotNumber, power.power_id)}
            >
              <SpriteIcon name={getPowerIconName(power)} size={24} />
              <span>{power.name}</span>
            </button>
          );
        })}
      </div>
    </AnchoredSelectionDialog>
  );
}
