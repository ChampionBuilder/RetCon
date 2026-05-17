import type { BuildSlot } from "../types/builds";
import type { Power } from "../types/powers";
import { arrangeItemsByColumns } from "../utils/gridLayout";
import { getPowerIconName } from "../utils/icons";
import { getPowerTooltipText } from "../utils/powerText";
import { formatFrameworkName, isStandardDevice } from "../utils/powerFrameworks";
import type { DialogAnchor } from "./AnchoredDialog";
import { AnchoredDialog } from "./AnchoredDialog";
import { SpriteIcon } from "./SpriteIcon";

type DeviceSelectionDialogProps = {
  anchor: DialogAnchor;
  buildSlot: BuildSlot;
  powers: Power[];
  onClearDevice: (slotNumber: number) => void;
  onClose: () => void;
  onSelectDevice: (slotNumber: number, power: Power) => void;
};

export function DeviceSelectionDialog({
  anchor,
  buildSlot,
  powers,
  onClearDevice,
  onClose,
  onSelectDevice,
}: DeviceSelectionDialogProps) {
  const devices = powers.filter((power) => isStandardDevice(power));
  const frameworkIds = Array.from(
    new Set(devices.map((device) => device.framework_id)),
  ).sort((a, b) => formatFrameworkName(a).localeCompare(formatFrameworkName(b)));

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select device"
      className="selection-dialog power-selection-dialog device-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onClearDevice(buildSlot.slot)}
        >
          Clear
        </button>
        <strong>Device</strong>
        <button
          aria-label="Close device selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="power-selection-list">
        {frameworkIds.map((frameworkId) => {
          const frameworkDevices = devices
            .filter((device) => device.framework_id === frameworkId)
            .sort((a, b) => a.name.localeCompare(b.name));

          return (
            <section className="power-selection-group" key={frameworkId ?? "unknown"}>
              <strong className="power-variant-selection-group__title">
                {formatFrameworkName(frameworkId) || "Unknown"}
              </strong>
              <div className="power-selection-grid">
                {arrangeItemsByColumns(frameworkDevices, 2).map((device) => {
                  const isCurrent =
                    buildSlot.power?.power_id === device.power_id;

                  return (
                    <button
                      className={[
                        "power-selection-choice",
                        isCurrent ? "power-selection-choice--current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={device.power_id}
                      title={getPowerTooltipText(device)}
                      type="button"
                      onClick={() => onSelectDevice(buildSlot.slot, device)}
                    >
                      <SpriteIcon name={getPowerIconName(device)} size={22} />
                      <span>{device.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AnchoredDialog>
  );
}
