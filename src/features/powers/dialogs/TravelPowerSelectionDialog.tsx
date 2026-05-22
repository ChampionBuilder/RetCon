import { useState } from "react";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { arrangeItemsByColumns } from "@/shared/utils/gridLayout";
import { getPowerIconName } from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { formatFrameworkName, isTravelPower } from "@/utils/powerFrameworks";
import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";
import { AnchoredDialog } from "@/shared/ui/AnchoredDialog";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type TravelPowerSelectionDialogProps = {
  anchor: DialogAnchor;
  buildSlot: BuildSlot;
  powers: Power[];
  onClearTravelPower: (slotNumber: number) => void;
  onClose: () => void;
  onSelectTravelPower: (slotNumber: number, power: Power) => void;
};

export function TravelPowerSelectionDialog({
  anchor,
  buildSlot,
  powers,
  onClearTravelPower,
  onClose,
  onSelectTravelPower,
}: TravelPowerSelectionDialogProps) {
  const travelPowers = powers.filter((power) => isTravelPower(power));
  const frameworkIds = Array.from(
    new Set(travelPowers.map((power) => power.framework_id)),
  );
  const [selectedFramework, setSelectedFramework] = useState<string | null>(
    buildSlot.power?.framework_id ?? null,
  );
  const selectedFrameworkTitle =
    selectedFramework === null
      ? "All travel powers"
      : formatFrameworkName(selectedFramework);
  const visibleFrameworkIds =
    selectedFramework === null ? frameworkIds : [selectedFramework];

  return (
    <AnchoredDialog
      anchor={anchor}
      ariaLabel="Select travel power"
      className="selection-dialog power-selection-dialog travel-power-selection-dialog"
      onClose={onClose}
    >
      <div className="selection-dialog__menu">
        <button
          className="tab-button"
          type="button"
          onClick={() => onClearTravelPower(buildSlot.slot)}
        >
          Clear
        </button>
        <span className="power-selection-dialog__framework-title">
          {selectedFrameworkTitle}
        </span>
        <button
          aria-label="Close travel power selection"
          className="dialog-close"
          type="button"
          onClick={onClose}
        >X</button>
      </div>

      <div
        className="power-selection-framework-strip"
        aria-label="Travel power frameworks"
      >
        <button
          className={
            selectedFramework === null
              ? "framework-button framework-button--active"
              : "framework-button"
          }
          type="button"
          onClick={() => setSelectedFramework(null)}
          title="All travel powers"
        >
          <SpriteIcon name="Any_Generic" size={24} />
        </button>
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
              <SpriteIcon
                name={
                  frameworkId === null
                    ? "Any_Generic"
                    : `TravelPower_${frameworkId}`
                }
                size={24}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="power-selection-list">
        {visibleFrameworkIds.map((frameworkId) => {
          const frameworkTravelPowers = travelPowers
            .filter((power) => power.framework_id === frameworkId)
            .sort((a, b) => a.name.localeCompare(b.name));

          return (
            <section className="power-selection-group" key={frameworkId ?? "unknown"}>
              <strong className="power-variant-selection-group__title">
                {formatFrameworkName(frameworkId) || "Unknown"}
              </strong>
              <div className="power-selection-grid">
                {arrangeItemsByColumns(frameworkTravelPowers, 2).map((power) => {
                  const isCurrent =
                    buildSlot.power?.power_id === power.power_id;

                  return (
                    <button
                      className={[
                        "power-selection-choice",
                        isCurrent ? "power-selection-choice--current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={power.power_id}
                      data-power-tooltip={getPowerTooltipAttribute(power)}
                      title={getPowerTooltipText(power)}
                      type="button"
                      onClick={() => onSelectTravelPower(buildSlot.slot, power)}
                    >
                      <SpriteIcon name={getPowerIconName(power)} size={22} />
                      <span>{power.name}</span>
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
