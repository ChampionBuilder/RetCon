import type { MouseEvent } from "react";
import type { GearBuildSlot, GearItem } from "@/types/gear";
import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";

type GearPanelProps = {
  gearSlots: GearBuildSlot[];
  onToggleCollapse: () => void;
  onSelectGearMod: (
    slotId: string,
    modSlotIndex: number,
    anchor: DialogAnchor,
  ) => void;
  onSelectGearModRank: (
    slotId: string,
    modSlotIndex: number,
    anchor: DialogAnchor,
  ) => void;
  onSelectGearSlot: (slotId: string, anchor: DialogAnchor) => void;
};

function getGearIconName(gear: GearItem | null | undefined) {
  return gear?.icon_override
    ? `/gear-icons/${gear.icon_override}.png`
    : "Icon_Bag";
}

function getSelectedModIconName(
  selectedMod: GearBuildSlot["selectedMods"][number],
) {
  return selectedMod?.mod.icon_override
    ? `/gear-icons/${selectedMod.mod.icon_override}.png`
    : "Any_Generic";
}

function GearName({ name }: { name: string }) {
  return name.split(/<br\s*\/?>/iu).map((part, index, parts) => (
    <span key={`${part}-${index}`}>
      {part}
      {index + 1 < parts.length ? <br /> : null}
    </span>
  ));
}

function formatModSlotTitle(slotTypes: string[]) {
  return slotTypes
    .filter((slotType) => slotType !== "Multicore")
    .map((slotType) => (slotType === "Enhancement" ? "Enhenc." : slotType))
    .join(" / ");
}

function formatSelectedModLabel(
  selectedMod: GearBuildSlot["selectedMods"][number],
) {
  if (!selectedMod) {
    return null;
  }

  if (selectedMod.rank === null) {
    return "Select rank";
  }

  return `${selectedMod.mod.name} R${selectedMod.rank}`;
}

function formatModSlotLabel(
  selectedMod: GearBuildSlot["selectedMods"][number],
  slotTypes: string[],
) {
  return selectedMod
    ? formatSelectedModLabel(selectedMod)
    : formatModSlotTitle(slotTypes);
}

function isStatModSlot(slotTypes: string[]) {
  return slotTypes.some(
    (slotType) => slotType === "Armoring" || slotType === "Enhancement",
  );
}

function getDisplayModSlots(gearSlot: GearBuildSlot) {
  const indexedSlots = (gearSlot.gear?.mod_slots ?? []).map(
    (slotTypes, modSlotIndex) => ({
      modSlotIndex,
      slotTypes,
    }),
  );

  if (gearSlot.gearSlot !== "Primary") {
    return indexedSlots;
  }

  const statSlots = indexedSlots.filter(({ slotTypes }) =>
    isStatModSlot(slotTypes),
  );
  const roleSlots = indexedSlots.filter(
    ({ slotTypes }) => !isStatModSlot(slotTypes),
  );
  const rowCount = Math.max(statSlots.length, roleSlots.length);

  return Array.from({ length: rowCount }).flatMap((_, index) =>
    [statSlots[index], roleSlots[index]].filter(
      (slot): slot is (typeof indexedSlots)[number] => Boolean(slot),
    ),
  );
}

function openGearSlot(
  event: MouseEvent<HTMLElement>,
  gearSlot: GearBuildSlot,
  onSelectGearSlot: (slotId: string, anchor: DialogAnchor) => void,
) {
  onSelectGearSlot(gearSlot.id, {
    x: event.clientX,
    y: event.clientY,
  });
}

export function GearPanel({
  gearSlots,
  onToggleCollapse,
  onSelectGearMod,
  onSelectGearModRank,
  onSelectGearSlot,
}: GearPanelProps) {
  const sections = ["Primary", "Secondary"].map((section) => ({
    key: section.toLowerCase(),
    title: `${section} Gear`,
    slots: gearSlots.filter((slot) => slot.gearSlot === section),
  }));

  return (
    <aside className="panel gear-panel">
      <h2>
        <button
          className="panel-title-button"
          type="button"
          onClick={onToggleCollapse}
        >
          Gear
        </button>
      </h2>

      <div className="gear-panel__body">
        {sections.map((section) => (
          <section className="power-tier build-section gear-section" key={section.key}>
            <div className="power-tier__toggle power-tier__toggle--static">
              <span>{section.title}</span>
            </div>

            <div className="build-extra-section gear-build-list">
              {section.slots.map((gearSlot) => {
                return (
                  <div
                    className="build-entry gear-build-entry"
                    key={gearSlot.id}
                  >
                    <div
                      className={[
                        "build-entry__summary",
                        `gear-build-entry__summary--${gearSlot.gearType.toLowerCase()}`,
                        gearSlot.gear ? "" : "build-entry__summary--empty",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={(event) =>
                        openGearSlot(event, gearSlot, onSelectGearSlot)
                      }
                    >
                      <div className="build-entry__power-main">
                        <SpriteIcon
                          className="gear-build-entry__gear-icon"
                          name={getGearIconName(gearSlot.gear)}
                          size={44}
                        />
                        <div className="gear-build-entry__content">
                        <button
                          className="build-entry__name-button"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openGearSlot(event, gearSlot, onSelectGearSlot);
                          }}
                        >
                          <GearName
                            name={
                              gearSlot.gear?.name ??
                              `Empty ${gearSlot.gearType.toLowerCase()} gear`
                            }
                          />
                        </button>
                        <div
                          className={[
                            "gear-mod-button-list",
                            `gear-mod-button-list--${gearSlot.gearSlot.toLowerCase()}`,
                          ].join(" ")}
                        >
                          {getDisplayModSlots(gearSlot).map(
                            ({ slotTypes, modSlotIndex }) => {
                              const selectedMod =
                                gearSlot.selectedMods[modSlotIndex] ?? null;
                              const selectedModLabel =
                                formatSelectedModLabel(selectedMod);
                              const modSlotLabel = formatModSlotLabel(
                                selectedMod,
                                slotTypes,
                              );

                              return (
                                <div
                                  className={[
                                    "gear-mod-cell",
                                    selectedMod ? "gear-mod-button--filled" : "",
                                    selectedMod ? "" : "gear-mod-button--empty",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  key={`${gearSlot.id}-${modSlotIndex}`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    className="gear-mod-button"
                                    title={
                                      selectedModLabel ??
                                      `${formatModSlotTitle(slotTypes)} mod slot`
                                    }
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onSelectGearMod(
                                        gearSlot.id,
                                        modSlotIndex,
                                        {
                                          x: event.clientX,
                                          y: event.clientY,
                                        },
                                      );
                                    }}
                                  >
                                    <SpriteIcon
                                      className="gear-mod-button__placeholder-icon"
                                      name={getSelectedModIconName(selectedMod)}
                                      width={28}
                                      height={38}
                                    />
                                  </button>
                                  {selectedMod ? (
                                    <button
                                      className={[
                                        "gear-mod-button__label",
                                        "gear-mod-button__label-button",
                                        selectedMod.rank === null
                                          ? "gear-mod-button__label-button--pending-rank"
                                          : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                      title={modSlotLabel ?? undefined}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onSelectGearModRank(
                                          gearSlot.id,
                                          modSlotIndex,
                                          {
                                            x: event.clientX,
                                            y: event.clientY,
                                          },
                                        );
                                      }}
                                    >
                                      {modSlotLabel}
                                    </button>
                                  ) : (
                                    <span
                                      className="gear-mod-button__label"
                                      title={modSlotLabel ?? undefined}
                                    >
                                      {modSlotLabel}
                                    </span>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
