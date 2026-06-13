import { useMemo, useState } from "react";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { arrangeItemsByColumns } from "@/shared/utils/gridLayout";
import { getPowerIconName } from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import { formatFrameworkName, isTravelPower } from "@/utils/powerFrameworks";
import { getFrameworkGlossaryTooltipAttribute } from "@/utils/frameworkGlossary";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
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
  const powersById = useMemo(() => {
    return new Map(powers.map((power) => [power.power_id, power]));
  }, [powers]);
  const travelPowers = powers.filter((power) => isTravelPower(power));
  const frameworkIds = Array.from(
    new Set(travelPowers.map((power) => power.framework_id)),
  );
  const [selectedFramework, setSelectedFramework] = useState<string | null>(() => {
    const currentFrameworkId = buildSlot.power?.framework_id ?? null;

    return currentFrameworkId && frameworkIds.includes(currentFrameworkId)
      ? currentFrameworkId
      : frameworkIds[0] ?? null;
  });
  const selectedFrameworkTitle =
    selectedFramework === null
      ? "Travel powers"
      : formatFrameworkName(selectedFramework);
  const visibleFrameworkIds =
    selectedFramework === null ? [] : [selectedFramework];

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select travel power"
      className="power-selection-dialog travel-power-selection-dialog"
      closeAriaLabel="Close travel power selection"
      menuChildren={
        <>
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
        </>
      }
      onClose={onClose}
    >
      <div
        className="power-selection-framework-strip"
        aria-label="Travel power frameworks"
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
              data-framework-tooltip={getFrameworkGlossaryTooltipAttribute(
                frameworkId ?? "unknown",
                formatFrameworkName(frameworkId) || "Unknown",
              )}
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
                      type="button"
                      onClick={() => onSelectTravelPower(buildSlot.slot, power)}
                    >
                      <SpriteIcon name={getPowerIconName(power)} size={22} />
                      <span
                        className="power-selection-choice__label"
                        data-power-tooltip={getPowerTooltipAttribute(
                          power,
                          undefined,
                          powersById,
                        )}
                        title={getPowerTooltipText(power)}
                      >
                        {power.name}
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
