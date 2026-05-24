import { useState } from "react";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { arrangeItemsByColumns } from "@/shared/utils/gridLayout";
import { getFrameworkIconName, getPowerIconName } from "@/shared/utils/icons";
import { getPowerTooltipText } from "@/shared/utils/powerText";
import { getPowerTooltipAttribute } from "@/shared/utils/powerTooltip";
import {
  formatFrameworkName,
  getFrameworkGroupsForIds,
  getPowerFrameworkSortIndex,
  isPowerVariantDevice,
  isUltimatePowerVariantDevice,
} from "@/utils/powerFrameworks";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type PowerVariantSelectionDialogProps = {
  anchor: DialogAnchor;
  buildSlot: BuildSlot;
  powerVariantSlots: BuildSlot[];
  powers: Power[];
  onClearPowerVariant: (slotNumber: number) => void;
  onClose: () => void;
  onSelectPowerVariant: (slotNumber: number, power: Power) => void;
};

function getFrameworkTitle(
  frameworkGroups: ReturnType<typeof getFrameworkGroupsForIds>,
  frameworkId: string | null,
) {
  if (frameworkId === null) {
    return "All frameworks";
  }

  return (
    frameworkGroups
      .flatMap((frameworkGroup) => frameworkGroup.filters)
      .find((framework) => framework.id === frameworkId)?.title ?? frameworkId
  );
}

export function PowerVariantSelectionDialog({
  anchor,
  buildSlot,
  powerVariantSlots,
  powers,
  onClearPowerVariant,
  onClose,
  onSelectPowerVariant,
}: PowerVariantSelectionDialogProps) {
  const powerVariants = powers.filter((power) => isPowerVariantDevice(power));
  const frameworkGroups = getFrameworkGroupsForIds(
    powerVariants.map((power) => power.framework_id),
  );
  const [selectedFramework, setSelectedFramework] = useState<string | null>(
    buildSlot.power?.framework_id ?? null,
  );
  const selectedFrameworkTitle = getFrameworkTitle(
    frameworkGroups,
    selectedFramework,
  );
  const selectedPowerIds = new Set(
    powerVariantSlots
      .filter((slot) => slot.slot !== buildSlot.slot)
      .map((slot) => slot.power?.power_id)
      .filter((powerId) => powerId !== undefined),
  );
  const visiblePowerVariants = powerVariants.filter(
    (power) =>
      selectedFramework === null || power.framework_id === selectedFramework,
  );
  const visibleFrameworkIds = Array.from(
    new Set(visiblePowerVariants.map((power) => power.framework_id)),
  ).sort((a, b) => {
    const orderDifference =
      getPowerFrameworkSortIndex(a) - getPowerFrameworkSortIndex(b);

    return (
      orderDifference ||
      formatFrameworkName(a).localeCompare(formatFrameworkName(b))
    );
  });

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select power variant"
      className="power-selection-dialog power-variant-selection-dialog"
      closeAriaLabel="Close power variant selection"
      menuChildren={
        <>
          <button
            className="tab-button"
            type="button"
            onClick={() => onClearPowerVariant(buildSlot.slot)}
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
        aria-label="Power variant parent frameworks"
      >
        <button
          className={
            selectedFramework === null
              ? "framework-button framework-button--active"
              : "framework-button"
          }
          type="button"
          onClick={() => setSelectedFramework(null)}
          title="All frameworks"
        >
          <SpriteIcon name="Any_Generic" size={24} />
        </button>
        {frameworkGroups.map((frameworkGroup) => (
          <div className="framework-group" key={frameworkGroup.id}>
            {frameworkGroup.filters.map((framework) => (
              <button
                className={
                  selectedFramework === framework.id
                    ? "framework-button framework-button--active"
                    : "framework-button"
                }
                key={framework.id}
                type="button"
                onClick={() => setSelectedFramework(framework.id)}
                title={framework.title}
              >
                <SpriteIcon
                  name={framework.iconId ?? getFrameworkIconName(framework.id)}
                  size={24}
                />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="power-selection-list">
        {visibleFrameworkIds.map((frameworkId) => {
          const groupPowers = visiblePowerVariants
            .filter((power) => power.framework_id === frameworkId)
            .sort((a, b) => {
              const variantTypeDifference =
                Number(isUltimatePowerVariantDevice(a)) -
                Number(isUltimatePowerVariantDevice(b));

              return variantTypeDifference || a.name.localeCompare(b.name);
            });

          if (groupPowers.length === 0) {
            return null;
          }

          return (
            <section
              className="power-selection-group"
              key={frameworkId ?? "unknown"}
            >
              <strong className="power-variant-selection-group__title">
                {formatFrameworkName(frameworkId) || "Unknown"}
              </strong>
              <div className="power-selection-grid">
                {arrangeItemsByColumns(groupPowers, 2).map((power) => {
                  const isCurrent =
                    buildSlot.power?.power_id === power.power_id;
                  const isTaken = selectedPowerIds.has(power.power_id);

                  return (
                    <button
                      className={[
                        "power-selection-choice",
                        isCurrent ? "power-selection-choice--current" : "",
                        isTaken ? "power-selection-choice--taken" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={power.power_id}
                      data-power-tooltip={getPowerTooltipAttribute(power)}
                      title={getPowerTooltipText(power)}
                      type="button"
                      onClick={() =>
                        onSelectPowerVariant(buildSlot.slot, power)
                      }
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
    </AnchoredSelectionDialog>
  );
}
