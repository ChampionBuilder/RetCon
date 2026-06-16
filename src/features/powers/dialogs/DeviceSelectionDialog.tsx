import { useMemo, useState } from "react";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { arrangeItemsByColumns } from "@/shared/utils/gridLayout";
import {
  getDeviceFrameworkIconName,
  getPowerIconName,
} from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { formatFrameworkName, isStandardDevice } from "@/utils/powerFrameworks";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

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
  const powersById = useMemo(() => {
    return new Map(powers.map((power) => [power.power_id, power]));
  }, [powers]);
  const devices = powers.filter((power) => isStandardDevice(power));
  const frameworkIds = Array.from(
    new Set(devices.map((device) => device.framework_id)),
  );
  const [selectedFramework, setSelectedFramework] = useState<string | null>(() => {
    const currentFrameworkId = buildSlot.power?.framework_id ?? null;

    return currentFrameworkId && frameworkIds.includes(currentFrameworkId)
      ? currentFrameworkId
      : frameworkIds[0] ?? null;
  });
  const selectedFrameworkTitle =
    selectedFramework === null
      ? "Devices"
      : formatFrameworkName(selectedFramework) || "Unknown";
  const visibleFrameworkIds =
    selectedFramework === null ? [] : [selectedFramework];

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select device"
      className="power-selection-dialog device-selection-dialog"
      closeAriaLabel="Close device selection"
      menuChildren={
        <>
          <button
            className="tab-button"
            type="button"
            onClick={() => onClearDevice(buildSlot.slot)}
          >
            Clear
          </button>
          <span className="power-selection-dialog__framework-title">
            {selectedFrameworkTitle}
          </span>
        </>
      }
      onClose={onClose}
    >
      <div
        className="power-selection-framework-strip"
        aria-label="Device categories"
      >
        <div className="framework-group">
          {frameworkIds.map((frameworkId) => (
            <button
              className={
                selectedFramework === frameworkId
                  ? "framework-button framework-button--active"
                  : "framework-button"
              }
              key={frameworkId ?? "unknown"}
              type="button"
              onClick={() => setSelectedFramework(frameworkId)}
              title={formatFrameworkName(frameworkId) || "Unknown"}
            >
              <SpriteIcon name={getDeviceFrameworkIconName(frameworkId)} size={24} />
            </button>
          ))}
        </div>
      </div>

      <div className="power-selection-list">
        {visibleFrameworkIds.map((frameworkId) => {
          const frameworkDevices = devices
            .filter((device) => device.framework_id === frameworkId)
            .sort((a, b) => a.name.localeCompare(b.name));

          return (
            <section className="power-selection-group" key={frameworkId ?? "unknown"}>
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
                      type="button"
                      onClick={() => onSelectDevice(buildSlot.slot, device)}
                    >
                      <SpriteIcon name={getPowerIconName(device)} size={22} />
                      <span
                        className="power-selection-choice__label"
                        data-power-tooltip={getPowerTooltipAttribute(
                          device,
                          undefined,
                          powersById,
                        )}
                        title={getPowerTooltipText(device)}
                      >
                        {device.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AnchoredSelectionDialog>
  );
}
