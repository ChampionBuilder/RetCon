import type { GearBuildSlot, GearItem } from "@/types/gear";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";
import { getGearTooltipText } from "./gearTooltips";

type GearSelectionDialogProps = {
  anchor: DialogAnchor;
  gearSlot: GearBuildSlot;
  gears: GearItem[];
  onClearGear: (slotId: string) => void;
  onClose: () => void;
  onSelectGear: (slotId: string, gear: GearItem) => void;
};

function getGearIconName(gear: GearItem | null | undefined) {
  return gear?.icon_override
    ? `/gear-icons/${gear.icon_override}.png`
    : "Icon_Bag";
}

function GearName({ name }: { name: string }) {
  return name.split(/<br\s*\/?>/iu).map((part, index, parts) => (
    <span key={`${part}-${index}`}>
      {part}
      {index + 1 < parts.length ? <br /> : null}
    </span>
  ));
}

function groupGearsBySet(gears: GearItem[]) {
  const groups: Array<{ key: string; title: string; gears: GearItem[] }> = [];

  gears.forEach((gear) => {
    const title = gear.gear_set ?? "Other";
    const key = title;
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.gears.push(gear);
      return;
    }

    groups.push({
      key,
      title,
      gears: [gear],
    });
  });

  return groups;
}

export function GearSelectionDialog({
  anchor,
  gearSlot,
  gears,
  onClearGear,
  onClose,
  onSelectGear,
}: GearSelectionDialogProps) {
  const compatibleGears = gears.filter(
    (gear) =>
      !gear.is_disabled &&
      gear.gear_slot === gearSlot.gearSlot &&
      gear.gear_type === gearSlot.gearType,
  );
  const gearGroups = groupGearsBySet(compatibleGears);
  const title = `${gearSlot.gearSlot} ${gearSlot.gearType}`;

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select gear"
      className="power-selection-dialog gear-selection-dialog"
      closeAriaLabel="Close gear selection"
      menuChildren={
        <>
          <button
            className="tab-button"
            type="button"
            onClick={() => onClearGear(gearSlot.id)}
          >
            Clear
          </button>
          <span className="power-selection-dialog__framework-title">
            {title}
          </span>
        </>
      }
      onClose={onClose}
    >
      <div className="power-selection-list">
        {gearGroups.map((gearGroup) => (
          <section className="power-selection-group" key={gearGroup.key}>
            <strong className="power-variant-selection-group__title">
              {gearGroup.title}
            </strong>
            <div className="power-selection-grid">
              {gearGroup.gears.map((gear) => {
                const isCurrent = gearSlot.gear?.gear_id === gear.gear_id;

                return (
                  <button
                    className={[
                      "power-selection-choice",
                      isCurrent ? "power-selection-choice--current" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={gear.gear_id}
                    type="button"
                    onClick={() => onSelectGear(gearSlot.id, gear)}
                  >
                    <SpriteIcon name={getGearIconName(gear)} size={22} />
                    <span
                      className="power-selection-choice__label"
                      data-text-tooltip={getGearTooltipText(gear)}
                    >
                      <GearName name={gear.name} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AnchoredSelectionDialog>
  );
}
