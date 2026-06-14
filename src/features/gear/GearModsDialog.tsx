import type {
  GearBuildSlot,
  GearMod,
  GearModRank,
} from "@/types/gear";
import { AnchoredSelectionDialog, type DialogAnchor } from "@/shared/ui";
import { SpriteIcon } from "@/shared/ui/SpriteIcon";
import { formatGearModTooltipText } from "./gearModTooltips";

type GearModsDialogProps = {
  anchor: DialogAnchor;
  gearSlots: GearBuildSlot[];
  gearSlot: GearBuildSlot;
  modSlotIndex: number;
  mods: GearMod[];
  onClearMod: (slotId: string, modSlotIndex: number) => void;
  onClose: () => void;
  onSelectMod: (
    slotId: string,
    modSlotIndex: number,
    mod: GearMod,
    rank: GearModRank | null,
  ) => void;
};

const modRanks = [5, 7, 9] satisfies GearModRank[];

function getModRankIconName(mod: GearMod) {
  return mod.icon_override
    ? `/gear-icons/${mod.icon_override}.png`
    : "Any_Generic";
}

function formatModSlotTypes(slotTypes: string[]) {
  return slotTypes
    .filter((slotType) => slotType !== "Multicore")
    .join(" / ");
}

function isMulticoreMod(mod: GearMod) {
  return mod.mod_type === "Multicore" || mod.tag.includes("Multicore");
}

function isModCompatible(slotTypes: string[], mod: GearMod) {
  const primarySlotTypes = slotTypes.filter(
    (slotType) => slotType !== "Multicore",
  );
  const modTypes = new Set(mod.mod_types);

  if (isMulticoreMod(mod) && !slotTypes.includes("Multicore")) {
    return false;
  }

  return primarySlotTypes.every((slotType) => modTypes.has(slotType));
}

function getRankValue(mod: GearMod, rank: GearModRank) {
  return mod.bonuses
    .map((bonus) => bonus.values_by_rank?.[String(rank)] ?? null)
    .filter((value) => value !== null)
    .join(" / ") || null;
}

function getAvailableRanks(mod: GearMod) {
  return modRanks.filter((rank) => getRankValue(mod, rank) !== null);
}

function getGearMaxRank(gearSlot: GearBuildSlot) {
  const maxRank = Number(gearSlot.gear?.max_rank);

  return Number.isNaN(maxRank) ? null : maxRank;
}

function getAllowedRanks(mod: GearMod, gearSlot: GearBuildSlot) {
  const availableRanks = getAvailableRanks(mod);
  const maxRank = getGearMaxRank(gearSlot);

  return maxRank === null
    ? availableRanks
    : availableRanks.filter((rank) => rank <= maxRank);
}

function isStackableMod(mod: GearMod) {
  return String(mod.stackable ?? "true").toLowerCase() !== "false";
}

function isSameNonStackableMod(a: GearMod, b: GearMod) {
  return a.name === b.name;
}

function isNonStackableModAlreadySelected(
  candidateMod: GearMod,
  gearSlots: GearBuildSlot[],
  activeSlotId: string,
  activeModSlotIndex: number,
) {
  if (isStackableMod(candidateMod)) {
    return false;
  }

  return gearSlots.some((slot) =>
    slot.selectedMods.some((selectedMod, selectedModIndex) => {
      if (!selectedMod) {
        return false;
      }

      if (slot.id === activeSlotId && selectedModIndex === activeModSlotIndex) {
        return false;
      }

      return isSameNonStackableMod(candidateMod, selectedMod.mod);
    }),
  );
}

function hasCompatibleRankForSlot(mod: GearMod, gearSlot: GearBuildSlot) {
  const availableRanks = getAvailableRanks(mod);

  return availableRanks.length === 0 || getAllowedRanks(mod, gearSlot).length > 0;
}

export function GearModsDialog({
  anchor,
  gearSlots,
  gearSlot,
  modSlotIndex,
  mods,
  onClearMod,
  onClose,
  onSelectMod,
}: GearModsDialogProps) {
  const modSlots = gearSlot.gear?.mod_slots ?? [];
  const activeModSlotTypes = modSlots[modSlotIndex] ?? [];
  const compatibleMods = activeModSlotTypes
    .length > 0
    ? mods.filter(
        (mod) =>
          !mod.is_disabled &&
          isModCompatible(activeModSlotTypes, mod) &&
          hasCompatibleRankForSlot(mod, gearSlot),
      )
    : [];
  const title = `${formatModSlotTypes(activeModSlotTypes)} Mod`;

  return (
    <AnchoredSelectionDialog
      anchor={anchor}
      ariaLabel="Select gear mods"
      className="power-selection-dialog gear-mods-dialog"
      closeAriaLabel="Close gear mods"
      menuChildren={
        <>
          <button
            className="tab-button"
            type="button"
            onClick={() => onClearMod(gearSlot.id, modSlotIndex)}
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
      <div className="power-selection-list gear-mods-dialog__body">
        <section className="power-selection-group">
          <div className="power-selection-grid">
            {compatibleMods.map((mod) => {
              const selectedMod = gearSlot.selectedMods[modSlotIndex] ?? null;
              const isCurrent = selectedMod?.mod.mod_id === mod.mod_id;
              const allowedRanks = getAllowedRanks(mod, gearSlot);
              const autoSelectedRank =
                allowedRanks.length === 1 ? allowedRanks[0] : null;
              const isAlreadySelected = isNonStackableModAlreadySelected(
                mod,
                gearSlots,
                gearSlot.id,
                modSlotIndex,
              );

              return (
                <button
                  className={[
                    "power-selection-choice",
                    "gear-mods-dialog__mod-choice",
                    isCurrent ? "power-selection-choice--current" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={isAlreadySelected}
                  key={mod.mod_id}
                  data-text-tooltip={
                    isAlreadySelected
                      ? "This mod cannot be stacked"
                      : formatGearModTooltipText(mod)
                  }
                  type="button"
                  onClick={() =>
                    onSelectMod(
                      gearSlot.id,
                      modSlotIndex,
                      mod,
                      autoSelectedRank,
                    )
                  }
                >
                  <SpriteIcon name={getModRankIconName(mod)} size={22} />
                  <span
                    className="power-selection-choice__label"
                  >
                    {mod.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AnchoredSelectionDialog>
  );
}
