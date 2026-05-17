import type { Power } from "../types/powers";
import { getPowerIconName } from "../utils/icons";
import { getPowerTooltipText } from "../utils/powerText";
import type { DialogAnchor } from "./AnchoredDialog";
import { AnchoredDialog } from "./AnchoredDialog";
import { SpriteIcon } from "./SpriteIcon";

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
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select archetype power"
      className="selection-dialog archetype-power-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <strong>Power choice</strong>
        <button
          aria-label="Close archetype power selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>

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
    </AnchoredDialog>
  );
}
